import { createRateLimitStore } from "./rate-limit/store.js";

const defaultStore = createRateLimitStore();
const stats = new Map();
const DEFAULT_BUCKET_TTL_MS = 10 * 60 * 1000;

function getStats(endpoint) {
  if (!stats.has(endpoint)) {
    stats.set(endpoint, { attempts: 0, rejected: 0 });
  }

  return stats.get(endpoint);
}

function getBucketKey(endpoint, subjectKey) {
  return `${endpoint}:${subjectKey}`;
}

function refillBucket(bucket, limitPerMinute, burstCapacity, now = Date.now()) {
  const elapsedMinutes = (now - bucket.lastRefillAt) / 60000;
  const refillAmount = elapsedMinutes * limitPerMinute;

  bucket.tokens = Math.min(burstCapacity, bucket.tokens + refillAmount);
  bucket.lastRefillAt = now;
}

async function cleanupExpiredBuckets(store, now = Date.now()) {
  if (typeof store?.cleanupExpiredBuckets === "function") {
    await store.cleanupExpiredBuckets(now, DEFAULT_BUCKET_TTL_MS);
  }
}

export function getRateLimitIdentifier(request, userId) {
  if (userId) {
    return { kind: "user", value: userId };
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = (forwardedFor?.split(",")[0] || realIp || "unknown").trim();

  return { kind: "ip", value: ip || "unknown" };
}

export async function enforceRateLimit({
  endpoint,
  subject,
  limitPerMinute,
  burstCapacity = limitPerMinute,
  store = defaultStore,
  now = Date.now(),
}) {
  await cleanupExpiredBuckets(store, now);

  const subjectKey = `${subject.kind}:${subject.value}`;
  const bucketKey = getBucketKey(endpoint, subjectKey);
  const statsEntry = getStats(endpoint);

  statsEntry.attempts += 1;

  const existingBucket = await store.getBucket(bucketKey);

  if (!existingBucket) {
    const nextBucket = {
      tokens: Math.max(0, burstCapacity - 1),
      lastRefillAt: now,
      limitPerMinute,
      burstCapacity,
    };

    await store.setBucket(bucketKey, nextBucket);

    return {
      allowed: true,
      remaining: Math.max(0, burstCapacity - 1),
      retryAfterSeconds: 0,
      rejectionRate: statsEntry.attempts === 0 ? 0 : statsEntry.rejected / statsEntry.attempts,
    };
  }

  const nextBucket = { ...existingBucket };
  refillBucket(nextBucket, limitPerMinute, burstCapacity, now);

  await store.setBucket(bucketKey, nextBucket);

  if (nextBucket.tokens < 1) {
    const missingTokens = 1 - nextBucket.tokens;
    const retryAfterSeconds = Math.max(1, Math.ceil((missingTokens / limitPerMinute) * 60));

    statsEntry.rejected += 1;

    const rejectionRate = statsEntry.rejected / statsEntry.attempts;

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      rejectionRate,
    };
  }

  nextBucket.tokens -= 1;
  await store.setBucket(bucketKey, nextBucket);

  return {
    allowed: true,
    remaining: Math.floor(nextBucket.tokens),
    retryAfterSeconds: 0,
    rejectionRate: statsEntry.rejected / statsEntry.attempts,
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