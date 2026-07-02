import "server-only";
import { createRateLimitStore, refillBucket } from "@/lib/rate-limit/store";

let _defaultStore;

function getDefaultStore() {
  if (!_defaultStore) {
    _defaultStore = createRateLimitStore();
  }
  return _defaultStore;
}

export async function atomicCheckAndDeduct({
  endpoint,
  subject,
  limitPerMinute,
  burstCapacity = limitPerMinute,
  store = getDefaultStore(),
  now = Date.now(),
}) {
  const bucketKey = `${endpoint}:${subject.kind}:${subject.value}`;

  if (typeof store.checkAndDeduct === "function") {
    return store.checkAndDeduct(bucketKey, {
      limitPerMinute,
      burstCapacity,
      now,
    });
  }

  const bucket = await store.getBucket(bucketKey, now);
  let tokens;
  let lastRefillAt;

  if (!bucket) {
    tokens = burstCapacity;
    lastRefillAt = now;
  } else {
    tokens = bucket.tokens;
    lastRefillAt = bucket.lastRefillAt;
    const elapsedMinutes = (now - lastRefillAt) / 60000;
    tokens = Math.min(burstCapacity, tokens + elapsedMinutes * limitPerMinute);
    lastRefillAt = now;
  }

  let allowed = false;
  let retryAfterSeconds = 0;

  if (tokens >= 1) {
    tokens -= 1;
    allowed = true;
  } else {
    const missingTokens = 1 - tokens;
    retryAfterSeconds = limitPerMinute > 0
      ? Math.max(1, Math.ceil((missingTokens / limitPerMinute) * 60))
      : 60;
  }

  await store.setBucket(bucketKey, {
    tokens,
    lastRefillAt,
    limitPerMinute,
    burstCapacity,
  });

  return {
    allowed,
    remaining: Math.max(0, Math.floor(tokens)),
    retryAfterSeconds,
  };
}

export async function atomicGetAndSet(key, defaultValue, store = getDefaultStore()) {
  const existing = await store.getBucket(key);

  if (existing !== null && existing !== undefined) {
    return existing;
  }

  await store.setBucket(key, defaultValue);
  return defaultValue;
}

export async function atomicIncrement(key, store = getDefaultStore()) {
  const mutex = (await import("@/lib/rate-limit/mutex")).getGlobalBucketMutex();

  return mutex.withLock(key, async () => {
    const existing = await store.getBucket(key);
    const current = existing?.value ?? 0;
    const next = current + 1;

    await store.setBucket(key, { value: next, updatedAt: Date.now() });
    return next;
  });
}

export async function atomicDecrement(key, { min = 0 } = {}, store = getDefaultStore()) {
  const mutex = (await import("@/lib/rate-limit/mutex")).getGlobalBucketMutex();

  return mutex.withLock(key, async () => {
    const existing = await store.getBucket(key);
    const current = existing?.value ?? 0;
    const next = Math.max(min, current - 1);

    await store.setBucket(key, { value: next, updatedAt: Date.now() });
    return next;
  });
}

export async function resetStore() {
  if (_defaultStore) {
    await _defaultStore.close();
    _defaultStore = null;
  }
}
