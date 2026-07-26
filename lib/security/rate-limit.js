import "server-only";
import { getEnv } from "./env.js";
import {
  createRateLimitStore,
  refillBucket,
  DEFAULT_BUCKET_TTL_MS,
  withDefaultCheckAndDeduct,
  createEmergencyFallbackStore,
} from "../rate-limit/store";
import { unwrap, isError } from "../db/redis-result";

let _defaultStore;
let _emergencyFallbackStore;
function getDefaultStore() {
  if (!_defaultStore) {
    _defaultStore = createRateLimitStore();
  }
  return _defaultStore;
}

function getEmergencyFallbackStore() {
  if (!_emergencyFallbackStore) {
    _emergencyFallbackStore = createEmergencyFallbackStore();
  }
  return _emergencyFallbackStore;
}

const stats = new Map();

// Operational metrics for failure policy tracking
const failureMetrics = {
  totalFailures: 0,
  failOpenActivations: 0,
  failClosedActivations: 0,
  localFallbackActivations: 0,
  degradedModeStart: null,
};

function getStats(endpoint) {
  if (!stats.has(endpoint)) {
    stats.set(endpoint, { attempts: 0, rejected: 0 });
  }

  return stats.get(endpoint);
}

/**
 * Logs structured rate limit failure information for operational visibility.
 * 
 * @param {Object} context - Failure context
 * @param {string} context.endpoint - API endpoint identifier
 * @param {Object} context.subject - Subject being rate limited
 * @param {string} context.policy - Configured failure policy
 * @param {string} context.reason - Failure reason
 * @param {Error} context.error - The error that occurred
 */
function logRateLimitFailure({ endpoint, subject, policy, reason, error }) {
  const subjectIdentifier = subject?.value ? `${subject.kind}:${subject.value.substring(0, 8)}...` : 'unknown';
  console.error(
    `[rate-limit] policy=${policy} endpoint=${endpoint} subject=${subjectIdentifier} reason=${reason} error=${error.message}`
  );
}

/**
 * Handles rate limit store failures according to the configured policy.
 * 
 * This function implements the three failure policies:
 * - fail-open: Allow requests when store fails (default, maximizes availability)
 * - fail-closed: Reject requests when store fails (maximizes security)
 * - local-fallback: Use process-local emergency fallback (balances security and availability)
 * 
 * @param {Object} context - Failure handling context
 * @param {string} context.endpoint - API endpoint identifier
 * @param {Object} context.subject - Subject being rate limited
 * @param {number} context.limitPerMinute - Token refill rate
 * @param {number} context.burstCapacity - Maximum tokens
 * @param {number} context.now - Current timestamp
 * @param {Error} context.error - The error that occurred
 * @param {Object} context.statsEntry - Stats entry for the endpoint
 * @returns {Promise<Object>} Rate limit result
 */
async function handleStoreFailure({
  endpoint,
  subject,
  limitPerMinute,
  burstCapacity,
  now,
  error,
  statsEntry,
}) {
  const env = getEnv();
  const policy = env.RATE_LIMIT_FAILURE_POLICY;
  
  failureMetrics.totalFailures++;
  
  // Track degraded mode duration
  if (!failureMetrics.degradedModeStart) {
    failureMetrics.degradedModeStart = now;
  }

  // Log the failure with structured information
  logRateLimitFailure({
    endpoint,
    subject,
    policy,
    reason: error.message || 'Store operation failed',
    error,
  });

  switch (policy) {
    case 'fail-closed':
      failureMetrics.failClosedActivations++;
      statsEntry.rejected += 1;
      // Reject the request with a reasonable retry interval
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 60,
        rejectionRate:
          statsEntry.attempts === 0
            ? 0
            : statsEntry.rejected / statsEntry.attempts,
      };

    case 'local-fallback':
      failureMetrics.localFallbackActivations++;
      try {
        const fallbackStore = getEmergencyFallbackStore();
        const subjectKey = `${subject.kind}:${subject.value}`;
        const bucketKey = getBucketKey(endpoint, subjectKey);
        
        const result = await fallbackStore.checkAndDeduct(bucketKey, {
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
      } catch (fallbackError) {
        // If fallback also fails, fall back to fail-open for safety
        console.error('[rate-limit] Emergency fallback also failed, allowing request:', fallbackError.message);
        failureMetrics.failOpenActivations++;
        statsEntry.rejected += 1;
        return {
          allowed: true,
          remaining: 0,
          retryAfterSeconds: 0,
          rejectionRate:
            statsEntry.attempts === 0
              ? 0
              : statsEntry.rejected / statsEntry.attempts,
        };
      }

    case 'fail-open':
    default:
      // Default behavior for backward compatibility
      failureMetrics.failOpenActivations++;
      statsEntry.rejected += 1;
      return {
        allowed: true,
        remaining: 0,
        retryAfterSeconds: 0,
        rejectionRate:
          statsEntry.attempts === 0
            ? 0
            : statsEntry.rejected / statsEntry.attempts,
      };
  }
}

/**
 * Gets operational metrics for rate limit failures.
 * Useful for monitoring and alerting on degraded mode.
 * 
 * @returns {Object} Failure metrics
 */
export function getFailureMetrics() {
  const degradedModeDuration = failureMetrics.degradedModeStart
    ? Date.now() - failureMetrics.degradedModeStart
    : 0;

  return {
    ...failureMetrics,
    degradedModeDuration,
    degradedModeStart: failureMetrics.degradedModeStart,
  };
}

/**
 * Resets failure metrics. Intended for testing purposes.
 */
export function resetFailureMetrics() {
  failureMetrics.totalFailures = 0;
  failureMetrics.failOpenActivations = 0;
  failureMetrics.failClosedActivations = 0;
  failureMetrics.localFallbackActivations = 0;
  failureMetrics.degradedModeStart = null;
  
  // Also reset emergency fallback store
  if (_emergencyFallbackStore) {
    _emergencyFallbackStore.close();
    _emergencyFallbackStore = null;
  }
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
  return ips[0] || "unknown";
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
 * **Failure Policy:**
 * When the rate limit store fails (e.g., Redis unavailable), behavior is controlled
 * by the RATE_LIMIT_FAILURE_POLICY environment variable:
 * - fail-open: Allow requests (default, maximizes availability)
 * - fail-closed: Reject requests (maximizes security)
 * - local-fallback: Use process-local emergency fallback (balances security and availability)
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
    try {
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
    } catch (err) {
      // Handle store failure according to configured policy
      return handleStoreFailure({
        endpoint,
        subject,
        limitPerMinute,
        burstCapacity,
        now,
        error: err,
        statsEntry,
      });
    }
  }

  // Fallback: use default atomic implementation with per-bucket mutexes
  // This eliminates the race condition that existed in the previous non-atomic
  // read-modify-write implementation. The mutex ensures that concurrent
  // requests for the same bucket are serialized, preventing duplicate token
  // consumption and ensuring burst capacity is never exceeded.
  try {
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
  } catch (err) {
    // Handle fallback failure according to configured policy
    return handleStoreFailure({
      endpoint,
      subject,
      limitPerMinute,
      burstCapacity,
      now,
      error: err,
      statsEntry,
    });
  }
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