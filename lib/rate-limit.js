import "server-only";
import { getEnv } from "./env.js";
import {
  createRateLimitStore,
  refillBucket,
  DEFAULT_BUCKET_TTL_MS,
  withDefaultCheckAndDeduct,
} from "./rate-limit/store.js";

let _defaultStore;
function getDefaultStore() {
  if (!_defaultStore) {
    _defaultStore = createRateLimitStore();
  }
  return _defaultStore;
}
const stats = new Map();

function getStats(endpoint) {
  if (!stats.has(endpoint)) {
    stats.set(endpoint, { attempts: 0, rejected: 0 });
  }

  return stats.get(endpoint);
}

function getBucketKey(endpoint, subjectKey) {
  return `${endpoint}:${subjectKey}`;
}

export async function cleanupExpiredBuckets(store, now = Date.now()) {
  if (typeof store?.cleanupExpiredBuckets === "function") {
    await store.cleanupExpiredBuckets(now, DEFAULT_BUCKET_TTL_MS);
  }
}

/**
 * Safely extracts the client IP from trusted proxy headers.
 * Prioritizes X-Real-IP (set by immediate trusted proxy).
 * Falls back to rightmost untrusted IP in X-Forwarded-For chain.
 * Uses slice from right to prevent client-side IP prepending attacks.
 */
export function extractTrustedClientIp(headers) {
  if (!headers) return "unknown";
  const { TRUSTED_PROXY_COUNT } = getEnv();

  // Prioritize X-Real-IP as it is set by the immediate trusted proxy / hosting platform edge
  // and cannot be spoofed by the client in standard production environments.
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return "unknown";
  }

  const ips = forwardedFor.split(",").map((ip) => ip.trim()).filter(Boolean);
  if (ips.length === 0) {
    return "unknown";
  }

  // Slice to only examine the trusted portion of the chain from the right.
  // The first entry of the trusted portion corresponds to the client IP.
  const trustedProxyCount = TRUSTED_PROXY_COUNT > 0 ? TRUSTED_PROXY_COUNT : 1;
  const trustedIps = ips.slice(-trustedProxyCount);
  return trustedIps[0] || "unknown";
}

export function getRateLimitIdentifier(request, userId) {
  if (userId) {
    return { kind: "user", value: userId };
  }

  const ip = extractTrustedClientIp(request.headers);

  return { kind: "ip", value: ip };
}

/**
 * Enforces rate limiting for a given endpoint and subject.
 * 
 * This function uses a token bucket algorithm with configurable burst capacity
 * and refill rate. It prefers native atomic operations when available (via
 * store.checkAndDeduct), but falls back to a mutex-based implementation that
 * guarantees atomicity for stores without native atomic operations.
 * 
 * **Race Condition Fix:**
 * The previous fallback implementation used a non-atomic read-modify-write sequence:
 *   1. getBucket() - read current state
 *   2. modify - calculate new state
 *   3. setBucket() - write new state
 * 
 * Under concurrent requests, multiple executions could read the same bucket
 * before either wrote its update, allowing duplicate token consumption and
 * exceeding burst capacity. The bucket initialization was also vulnerable to
 * multiple concurrent creations.
 * 
 * The new implementation uses per-bucket mutexes (via withDefaultCheckAndDeduct)
 * to serialize the read-modify-write sequence for each bucket key, ensuring:
 * - No duplicate token consumption
 * - Burst capacity is never exceeded
 * - Bucket creation is atomic
 * - Operations on different bucket keys proceed in parallel
 * 
 * @param {Object} options - Rate limit options
 * @param {string} options.endpoint - API endpoint identifier
 * @param {Object} options.subject - Subject being rate limited (user or IP)
 * @param {string} options.subject.kind - Subject type ('user' or 'ip')
 * @param {string} options.subject.value - Subject identifier
 * @param {number} options.limitPerMinute - Token refill rate per minute
 * @param {number} options.burstCapacity - Maximum tokens (defaults to limitPerMinute)
 * @param {Object} options.store - Rate limit store instance
 * @param {number} options.now - Current timestamp (defaults to Date.now())
 * @returns {Promise<Object>} Rate limit result with allowed, remaining, retryAfterSeconds, rejectionRate
 */
export async function enforceRateLimit({
  endpoint,
  subject,
  limitPerMinute,
  burstCapacity = limitPerMinute,
  store = getDefaultStore(),
  now = Date.now(),
}) {
  const subjectKey = `${subject.kind}:${subject.value}`;
  const bucketKey = getBucketKey(endpoint, subjectKey);
  const statsEntry = getStats(endpoint);

  statsEntry.attempts += 1;

  // Use atomic checkAndDeduct when available (native atomic operations)
  if (typeof store.checkAndDeduct === "function") {
    const result = await store.checkAndDeduct(bucketKey, {
      limitPerMinute,
      burstCapacity,
      now,
    });

    if (!result.allowed) {
      statsEntry.rejected += 1;
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      retryAfterSeconds: result.retryAfterSeconds,
      rejectionRate:
        statsEntry.attempts === 0
          ? 0
          : statsEntry.rejected / statsEntry.attempts,
    };
  }

  // Fallback: use default atomic implementation with per-bucket mutexes
  // This eliminates the race condition that existed in the previous non-atomic
  // read-modify-write implementation. The mutex ensures that concurrent
  // requests for the same bucket are serialized, preventing duplicate token
  // consumption and ensuring burst capacity is never exceeded.
  const result = await withDefaultCheckAndDeduct(store, bucketKey, {
    limitPerMinute,
    burstCapacity,
    now,
  });

  if (!result.allowed) {
    statsEntry.rejected += 1;
  }

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfterSeconds: result.retryAfterSeconds,
    rejectionRate:
      statsEntry.attempts === 0
        ? 0
        : statsEntry.rejected / statsEntry.attempts,
  };
}

export function buildRateLimitResponse({
  message = "Too Many Requests",
  retryAfterSeconds,
  sse = false,
}) {
  const body = JSON.stringify({
    error: message,
    retryAfterSeconds,
  });

  return new Response(sse ? `event: error\ndata: ${body}\n\n` : body, {
    status: 429,
    headers: {
      "Content-Type": sse ? "text/event-stream" : "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}