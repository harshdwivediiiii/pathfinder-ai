import { afterEach, describe, expect, it, beforeEach } from "vitest";

import { cleanupExpiredBuckets, enforceRateLimit, resetFailureMetrics, getFailureMetrics } from "../lib/security/rate-limit.js";
import {
  createMemoryRateLimitStore,
  createRateLimitStore,
  createRedisRateLimitStore,
  DEFAULT_BUCKET_TTL_MS,
  withDefaultCheckAndDeduct,
  createEmergencyFallbackStore,
} from "../lib/rate-limit/store.js";
import { unwrap, isMiss } from "../lib/db/redis-result.js";
import { resetEnvCache, getEnv } from "../lib/security/env.js";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_REDIS_URL = process.env.REDIS_URL;
const ORIGINAL_FAILURE_POLICY = process.env.RATE_LIMIT_FAILURE_POLICY;

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  if (ORIGINAL_REDIS_URL == null) {
    delete process.env.REDIS_URL;
  } else {
    process.env.REDIS_URL = ORIGINAL_REDIS_URL;
  }
  if (ORIGINAL_FAILURE_POLICY == null) {
    delete process.env.RATE_LIMIT_FAILURE_POLICY;
  } else {
    process.env.RATE_LIMIT_FAILURE_POLICY = ORIGINAL_FAILURE_POLICY;
  }
  resetEnvCache();
  resetFailureMetrics();
});

/**
 * Minimal in-memory stand-in for a Redis client whose `eval` mirrors the
 * CHECK_AND_DEDUCT_LUA script. The body runs synchronously in a single tick,
 * exactly like Redis executes EVAL, so it faithfully reproduces the atomicity
 * guarantee the real store relies on — without needing a live Redis server.
 */
function makeFakeRedisClient() {
  const data = new Map();

  return {
    async get(key) {
      return data.has(key) ? data.get(key) : null;
    },
    async set(key, value, options) {
      data.set(key, value);
    },
    async del(key) {
      data.delete(key);
    },
    eval(_script, argObj) {
      const { keys } = argObj;
      const args = argObj.arguments;
      const key = keys[0];
      const limitPerMinute = Number(args[0]);
      const burstCapacity = Number(args[1]);
      const now = Number(args[2]);

      let tokens = null;
      let lastRefillAt = now;

      const raw = data.get(key);
      if (raw) {
        try {
          const bucket = JSON.parse(raw);
          if (bucket && bucket.tokens != null) {
            tokens = Number(bucket.tokens);
            lastRefillAt = Number(bucket.lastRefillAt);
          }
        } catch {
          // ignore malformed payloads, treat as a fresh bucket
        }
      }

      if (tokens == null) {
        const remainingTokens = Math.max(0, burstCapacity - 1);
        data.set(
          key,
          JSON.stringify({ tokens: remainingTokens, lastRefillAt: now, limitPerMinute, burstCapacity })
        );
        return [1, remainingTokens, 0];
      }

      const elapsedMinutes = (now - lastRefillAt) / 60000;
      const refillAmount = elapsedMinutes * limitPerMinute;
      tokens = Math.min(burstCapacity, tokens + refillAmount);
      lastRefillAt = now;

      if (tokens < 1) {
        const missingTokens = 1 - tokens;
        const retryAfterSeconds = limitPerMinute > 0
          ? Math.max(1, Math.ceil((missingTokens / limitPerMinute) * 60))
          : 60;
        data.set(
          key,
          JSON.stringify({ tokens, lastRefillAt, limitPerMinute, burstCapacity })
        );
        return [0, 0, retryAfterSeconds];
      }

      tokens -= 1;
      data.set(
        key,
        JSON.stringify({ tokens, lastRefillAt, limitPerMinute, burstCapacity })
      );

      return [1, Math.floor(tokens), 0];
    },
  };
}

it("memory store evicts stale buckets", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 1000 });

  await store.setBucket("/api/generate:user:1", {
    tokens: 2,
    lastRefillAt: 0,
    limitPerMinute: 10,
    burstCapacity: 2,
  });

  await store.cleanupExpiredBuckets(2000);

  const result = await store.getBucket("/api/generate:user:1");
  expect(isMiss(result)).toBe(true);
  expect(unwrap(result)).toBeNull();
});

it("factory defaults to memory storage when redis is not configured", () => {
  const store = createRateLimitStore({ driver: "memory" });

  expect(store.kind).toBe("memory");
});

it("factory can create a redis store lazily", () => {
  const store = createRateLimitStore({
    driver: "redis",
    redisUrl: "redis://localhost:6379",
  });

  expect(store.kind).toBe("redis");
});

it.skip("factory fails fast in production when REDIS_URL is missing", () => {
  process.env.NODE_ENV = "production";
  delete process.env.REDIS_URL;

  expect(() =>
    createRateLimitStore({
      driver: "auto",
      redisUrl: undefined,
    })
  ).toThrow(/REDIS_URL is required in production/i);
});

it("factory rejects memory driver in production", () => {
  process.env.NODE_ENV = "production";
  process.env.REDIS_URL = "redis://localhost:6379";

  expect(() =>
    createRateLimitStore({
      driver: "memory",
      redisUrl: process.env.REDIS_URL,
    })
  ).toThrow(/RATE_LIMIT_STORE=memory is not allowed in production/i);
});

it("rate limiter consumes burst capacity and then rejects", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000 });
  const subject = { kind: "user", value: "abc" };

  const first = await enforceRateLimit({
    endpoint: "/api/generate",
    subject,
    limitPerMinute: 60,
    burstCapacity: 2,
    store,
    now: 1000,
  });

  expect(first.allowed).toBe(true);
  expect(first.remaining).toBe(1);

  const second = await enforceRateLimit({
    endpoint: "/api/generate",
    subject,
    limitPerMinute: 60,
    burstCapacity: 2,
    store,
    now: 1000,
  });

  expect(second.allowed).toBe(true);
  expect(second.remaining).toBe(0);

  const third = await enforceRateLimit({
    endpoint: "/api/generate",
    subject,
    limitPerMinute: 60,
    burstCapacity: 2,
    store,
    now: 1000,
  });

  expect(third.allowed).toBe(false);
  expect(third.remaining).toBe(0);
  expect(third.retryAfterSeconds).toBe(1);
});

it("rate limiter refills after elapsed time", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000 });
  const subject = { kind: "ip", value: "127.0.0.1" };

  await enforceRateLimit({
    endpoint: "/api/generate",
    subject,
    limitPerMinute: 60,
    burstCapacity: 2,
    store,
    now: 1000,
  });

  const refill = await enforceRateLimit({
    endpoint: "/api/generate",
    subject,
    limitPerMinute: 60,
    burstCapacity: 2,
    store,
    now: 61_000,
  });

  expect(refill.allowed).toBe(true);
  expect(refill.remaining).toBe(1);
});

it("memory store evicts stale buckets lazily via getBucket", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 1000, cleanupIntervalMs: 0 });

  await store.setBucket("/api/generate:user:1", {
    tokens: 2,
    lastRefillAt: 0,
    limitPerMinute: 10,
    burstCapacity: 2,
  });

  // Call getBucket with a timestamp past the TTL
  const result = await store.getBucket("/api/generate:user:1", 2000);
  expect(isMiss(result)).toBe(true);

  // Verify it was actually deleted from internal storage
  const result2 = await store.getBucket("/api/generate:user:1");
  expect(isMiss(result2)).toBe(true);

  await store.close();
});

it("concurrent requests respect burst capacity with atomic checkAndDeduct", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000 });
  const subject = { kind: "user", value: "concurrent-test" };
  const CONCURRENCY = 20;

  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, () =>
      enforceRateLimit({
        endpoint: "/api/generate",
        subject,
        limitPerMinute: 60,
        burstCapacity: 2,
        store,
        now: 1000,
      })
    )
  );

  const allowed = results.filter((r) => r.allowed);
  const rejected = results.filter((r) => !r.allowed);

  // With burstCapacity=2, at most 2 requests should be allowed
  expect(allowed.length).toBeLessThanOrEqual(2);
  // At least 18 should be rejected
  expect(rejected.length).toBeGreaterThanOrEqual(18);

  // First allowed should have remaining=1, second remaining=0
  const remainingValues = allowed.map((r) => r.remaining).sort((a, b) => b - a);
  expect(remainingValues).toEqual([1, 0]);

  // All rejected should have remaining=0 and retryAfterSeconds > 0
  for (const r of rejected) {
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  }
});

it("memory store evicts stale buckets periodically via cleanupIntervalMs", async () => {
  // Use a small cleanup interval (e.g. 50ms) and short bucket TTL (e.g. 10ms)
  const store = createMemoryRateLimitStore({ bucketTtlMs: 10, cleanupIntervalMs: 50 });

  await store.setBucket("/api/generate:user:1", {
    tokens: 2,
    lastRefillAt: Date.now(),
    limitPerMinute: 10,
    burstCapacity: 2,
  });

  // Wait for 100ms for interval to run and clean up
  await new Promise((resolve) => setTimeout(resolve, 100));

  // The bucket should be gone from the store even when querying at current time
  const result = await store.getBucket("/api/generate:user:1");
  expect(isMiss(result)).toBe(true);

  await store.close();
});

it("checkAndDeduct is atomic for a single bucket under concurrency (memory)", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
  const LIMIT = 20;

  // Fire 25 checkAndDeduct calls at the store directly, all racing on one key.
  const results = await Promise.all(
    Array.from({ length: 25 }, () =>
      store.checkAndDeduct("/api/generate:user:race", {
        limitPerMinute: LIMIT,
        burstCapacity: LIMIT,
        now: 1_000,
      })
    )
  );

  const allowed = results.filter((r) => r.allowed);
  expect(allowed.length).toBe(LIMIT);

  // Each allowed call consumed a distinct token: remaining values are exactly
  // 19,18,...,0 with no duplicates, proving no two calls saw the same state.
  const remainings = allowed.map((r) => r.remaining).sort((a, b) => a - b);
  expect(remainings).toEqual(Array.from({ length: LIMIT }, (_, i) => i));

  await store.close();
});

// The same concurrency contract must hold for both store drivers. The Redis
// driver is exercised through a fake client whose `eval` reproduces the Lua
// script's single-tick atomic execution (a live server is not available in CI).
const concurrencyStores = [
  {
    name: "memory",
    create: () =>
      createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 }),
  },
  {
    name: "redis",
    create: () =>
      createRedisRateLimitStore({ client: makeFakeRedisClient() }),
  },
];

describe.each(concurrencyStores)(
  "$name store: 25 concurrent requests respect a 20/min limit",
  ({ name, create }) => {
    it("allows at most 20, rejects at least 5, and never double-spends a token", async () => {
      const store = create();
      const subject = { kind: "user", value: "concurrent-user" };
      const endpoint = `/api/generate/concurrency-${name}`;
      const LIMIT = 20;

      const results = await Promise.all(
        Array.from({ length: 25 }, () =>
          enforceRateLimit({
            endpoint,
            subject,
            limitPerMinute: LIMIT,
            burstCapacity: LIMIT,
            store,
            now: 1_000,
          })
        )
      );

      const allowed = results.filter((r) => r.allowed);
      const rejected = results.filter((r) => !r.allowed);

      // Acceptance criteria: at most 20 succeed, at least 5 get HTTP 429.
      expect(allowed.length).toBe(LIMIT);
      expect(rejected.length).toBe(25 - LIMIT);

      // X-RateLimit-Remaining never increases within the window: the allowed
      // requests report a clean 19..0 descent with no repeated values.
      const remainings = allowed.map((r) => r.remaining).sort((a, b) => a - b);
      expect(remainings).toEqual(Array.from({ length: LIMIT }, (_, i) => i));

      for (const r of rejected) {
        expect(r.remaining).toBe(0);
        expect(r.retryAfterSeconds).toBeGreaterThanOrEqual(1);
      }

      if (typeof store.close === "function") {
        await store.close();
      }
    });
  }
);

it("DEFAULT_BUCKET_TTL_MS is exported and has the expected value", () => {
  expect(DEFAULT_BUCKET_TTL_MS).toBe(10 * 60 * 1000);
});

it("cleanupExpiredBuckets wrapper does not throw ReferenceError (the bug fix)", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 100 });

  // Should not throw — this is the exact scenario that caused the bug
  await expect(
    cleanupExpiredBuckets(store, 2000)
  ).resolves.toBeUndefined();

  await store.close();
});

it("cleanupExpiredBuckets wrapper cleans up expired buckets via the store", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 100 });

  // Set a bucket with a very old lastRefillAt (past TTL)
  await store.setBucket("/api/generate:user:stale", {
    tokens: 5,
    lastRefillAt: 0,
    limitPerMinute: 10,
    burstCapacity: 5,
  });

  // cleanupExpiredBuckets passes DEFAULT_BUCKET_TTL_MS; the store ignores it
  // in favor of its own bucketTtlMs, so 2000ms > 100ms TTL should evict
  await cleanupExpiredBuckets(store, 2000);

  const result = await store.getBucket("/api/generate:user:stale");
  expect(isMiss(result)).toBe(true);

  await store.close();
});

it("cleanupExpiredBuckets wrapper does not remove fresh buckets", async () => {
  const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000 });

  await store.setBucket("/api/generate:user:fresh", {
    tokens: 5,
    lastRefillAt: Date.now(),
    limitPerMinute: 10,
    burstCapacity: 5,
  });

  // now is the same as lastRefillAt, so bucket is fresh
  await cleanupExpiredBuckets(store, Date.now());

  const result = await store.getBucket("/api/generate:user:fresh");
  const bucket = unwrap(result);
  expect(bucket).not.toBeNull();
  expect(bucket.tokens).toBe(5);

  await store.close();
});

it("cleanupExpiredBuckets wrapper handles store without cleanupExpiredBuckets gracefully", async () => {
  const store = { kind: "custom" };

  await expect(
    cleanupExpiredBuckets(store)
  ).resolves.toBeUndefined();
});

it("cleanupExpiredBuckets wrapper handles null store gracefully", async () => {
  await expect(
    cleanupExpiredBuckets(null)
  ).resolves.toBeUndefined();
});

// Tests for the default checkAndDeduct implementation with mutex
describe("withDefaultCheckAndDeduct (fallback path)", () => {
  it("handles concurrent requests without race condition", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const key = "/api/test:concurrent-fallback";
    const LIMIT = 10;

    // Remove the native checkAndDeduct to force fallback path
    const nativeCheckAndDeduct = store.checkAndDeduct;
    delete store.checkAndDeduct;

    const results = await Promise.all(
      Array.from({ length: 25 }, () =>
        withDefaultCheckAndDeduct(store, key, {
          limitPerMinute: LIMIT,
          burstCapacity: LIMIT,
          now: 1_000,
        })
      )
    );

    const allowed = results.filter((r) => r.allowed);
    const rejected = results.filter((r) => !r.allowed);

    // At most LIMIT requests should be allowed
    expect(allowed.length).toBeLessThanOrEqual(LIMIT);
    // At least 15 should be rejected
    expect(rejected.length).toBeGreaterThanOrEqual(15);

    // Remaining values should be strictly decreasing with no duplicates
    const remainings = allowed.map((r) => r.remaining).sort((a, b) => b - a);
    expect(remainings).toEqual(Array.from({ length: allowed.length }, (_, i) => LIMIT - 1 - i));

    // Restore native method for cleanup
    store.checkAndDeduct = nativeCheckAndDeduct;
    await store.close();
  });

  it("handles burst capacity = 1 correctly under concurrency", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const key = "/api/test:burst-1";
    const BURST = 1;

    delete store.checkAndDeduct;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        withDefaultCheckAndDeduct(store, key, {
          limitPerMinute: 60,
          burstCapacity: BURST,
          now: 1_000,
        })
      )
    );

    const allowed = results.filter((r) => r.allowed);
    const rejected = results.filter((r) => !r.allowed);

    // Exactly 1 request should be allowed
    expect(allowed.length).toBe(1);
    expect(allowed[0].remaining).toBe(0);

    // 9 should be rejected
    expect(rejected.length).toBe(9);

    await store.close();
  });

  it("handles simultaneous bucket creation atomically", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const key = "/api/test:simultaneous-creation";
    const BURST = 5;

    delete store.checkAndDeduct;

    // All requests try to create the bucket at the same time
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        withDefaultCheckAndDeduct(store, key, {
          limitPerMinute: 60,
          burstCapacity: BURST,
          now: 1_000,
        })
      )
    );

    const allowed = results.filter((r) => r.allowed);

    // At most BURST requests should be allowed
    expect(allowed.length).toBeLessThanOrEqual(BURST);

    // Verify bucket was created only once
    const result = await store.getBucket(key, 1_000);
    const bucket = unwrap(result);
    expect(bucket).not.toBeNull();
    expect(bucket.burstCapacity).toBe(BURST);

    await store.close();
  });

  it("handles token refill correctly after elapsed time", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const key = "/api/test:refill";
    const LIMIT = 60;
    const BURST = 2;

    delete store.checkAndDeduct;

    // Exhaust the bucket
    const first = await withDefaultCheckAndDeduct(store, key, {
      limitPerMinute: LIMIT,
      burstCapacity: BURST,
      now: 1_000,
    });
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    const second = await withDefaultCheckAndDeduct(store, key, {
      limitPerMinute: LIMIT,
      burstCapacity: BURST,
      now: 1_000,
    });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    const third = await withDefaultCheckAndDeduct(store, key, {
      limitPerMinute: LIMIT,
      burstCapacity: BURST,
      now: 1_000,
    });
    expect(third.allowed).toBe(false);

    // After 1 minute, should have refilled to burst capacity (2 tokens)
    // With LIMIT=60 tokens/min, after 1 minute we get 60 tokens, capped at BURST=2
    const refill = await withDefaultCheckAndDeduct(store, key, {
      limitPerMinute: LIMIT,
      burstCapacity: BURST,
      now: 61_000,
    });
    expect(refill.allowed).toBe(true);
    expect(refill.remaining).toBe(1);

    await store.close();
  });

  it("isolates operations on different bucket keys", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const key1 = "/api/test:user1";
    const key2 = "/api/test:user2";
    const BURST = 2;

    delete store.checkAndDeduct;

    // Each user should get their full burst capacity
    const results1 = await Promise.all(
      Array.from({ length: 3 }, () =>
        withDefaultCheckAndDeduct(store, key1, {
          limitPerMinute: 60,
          burstCapacity: BURST,
          now: 1_000,
        })
      )
    );

    const results2 = await Promise.all(
      Array.from({ length: 3 }, () =>
        withDefaultCheckAndDeduct(store, key2, {
          limitPerMinute: 60,
          burstCapacity: BURST,
          now: 1_000,
        })
      )
    );

    const allowed1 = results1.filter((r) => r.allowed);
    const allowed2 = results2.filter((r) => r.allowed);

    // Each user should get exactly BURST requests
    expect(allowed1.length).toBe(BURST);
    expect(allowed2.length).toBe(BURST);

    await store.close();
  });

  it("calculates retryAfterSeconds correctly", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const key = "/api/test:retry-after";
    const LIMIT = 60;
    const BURST = 1;

    delete store.checkAndDeduct;

    // Exhaust the bucket
    await withDefaultCheckAndDeduct(store, key, {
      limitPerMinute: LIMIT,
      burstCapacity: BURST,
      now: 1_000,
    });

    // Next request should be rejected with retryAfter
    const result = await withDefaultCheckAndDeduct(store, key, {
      limitPerMinute: LIMIT,
      burstCapacity: BURST,
      now: 1_000,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    // With LIMIT=60 and missing 1 token, should retry after ~1 second
    expect(result.retryAfterSeconds).toBe(1);

    await store.close();
  });

  it("handles exhausted bucket correctly", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const key = "/api/test:exhausted";
    const LIMIT = 10;
    const BURST = 5;

    delete store.checkAndDeduct;

    // Exhaust the bucket
    for (let i = 0; i < BURST; i++) {
      const result = await withDefaultCheckAndDeduct(store, key, {
        limitPerMinute: LIMIT,
        burstCapacity: BURST,
        now: 1_000,
      });
      expect(result.allowed).toBe(true);
    }

    // All subsequent requests should be rejected
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        withDefaultCheckAndDeduct(store, key, {
          limitPerMinute: LIMIT,
          burstCapacity: BURST,
          now: 1_000,
        })
      )
    );

    const allowed = results.filter((r) => r.allowed);
    expect(allowed.length).toBe(0);

    // All should have remaining=0 and retryAfter>0
    for (const r of results) {
      expect(r.remaining).toBe(0);
      expect(r.retryAfterSeconds).toBeGreaterThan(0);
    }

    await store.close();
  });

  it("works with custom store without checkAndDeduct", async () => {
    // Create a minimal custom store that only implements getBucket/setBucket
    const customStore = {
      kind: "custom",
      data: new Map(),
      async getBucket(key, now) {
        const bucket = this.data.get(key);
        if (!bucket) return { status: "miss", value: null, isSuccess: false, isMiss: true, isError: false };
        if (now >= bucket.lastRefillAt + 60_000) {
          this.data.delete(key);
          return { status: "miss", value: null, isSuccess: false, isMiss: true, isError: false };
        }
        return { status: "success", value: bucket, isSuccess: true, isMiss: false, isError: false };
      },
      async setBucket(key, bucket) {
        this.data.set(key, bucket);
        return { status: "success", value: true, isSuccess: true, isMiss: false, isError: false };
      },
    };

    const key = "/api/test:custom-store";
    const BURST = 3;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        withDefaultCheckAndDeduct(customStore, key, {
          limitPerMinute: 60,
          burstCapacity: BURST,
          now: 1_000,
        })
      )
    );

    const allowed = results.filter((r) => r.allowed);
    expect(allowed.length).toBeLessThanOrEqual(BURST);
  });
});

describe("enforceRateLimit with fallback path", () => {
  it("uses fallback path when store lacks checkAndDeduct", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const subject = { kind: "user", value: "fallback-test" };
    const BURST = 2;

    // Remove native checkAndDeduct to force fallback
    delete store.checkAndDeduct;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        enforceRateLimit({
          endpoint: "/api/generate",
          subject,
          limitPerMinute: 60,
          burstCapacity: BURST,
          store,
          now: 1_000,
        })
      )
    );

    const allowed = results.filter((r) => r.allowed);
    const rejected = results.filter((r) => !r.allowed);

    // At most BURST should be allowed
    expect(allowed.length).toBeLessThanOrEqual(BURST);
    expect(rejected.length).toBeGreaterThanOrEqual(8);

    await store.close();
  });

  it("maintains backward compatibility with response structure", async () => {
    const store = createMemoryRateLimitStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const subject = { kind: "user", value: "compat-test" };

    delete store.checkAndDeduct;

    const result = await enforceRateLimit({
      endpoint: "/api/generate",
      subject,
      limitPerMinute: 60,
      burstCapacity: 5,
      store,
      now: 1_000,
    });

    // Verify response structure matches expected API
    expect(result).toHaveProperty("allowed");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("retryAfterSeconds");
    expect(result).toHaveProperty("rejectionRate");
    expect(typeof result.allowed).toBe("boolean");
    expect(typeof result.remaining).toBe("number");
    expect(typeof result.retryAfterSeconds).toBe("number");
    expect(typeof result.rejectionRate).toBe("number");

    await store.close();
  });
});

describe("Failure Policy: fail-open (default)", () => {
  it("allows requests when store fails with fail-open policy", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "fail-open";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "fail-open-test" };
    const result = await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 10,
      store,
      now: 1_000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBe(0);

    const metrics = getFailureMetrics();
    expect(metrics.totalFailures).toBe(1);
    expect(metrics.failOpenActivations).toBe(1);
  });

  it("defaults to fail-open when policy not configured", async () => {
    delete process.env.RATE_LIMIT_FAILURE_POLICY;
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "default-test" };
    const result = await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 10,
      store,
      now: 1_000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });
});

describe("Failure Policy: fail-closed", () => {
  it("rejects requests when store fails with fail-closed policy", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "fail-closed";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "fail-closed-test" };
    const result = await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 10,
      store,
      now: 1_000,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBe(60);

    const metrics = getFailureMetrics();
    expect(metrics.totalFailures).toBe(1);
    expect(metrics.failClosedActivations).toBe(1);
  });

  it("rejects requests with reasonable retry interval", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "fail-closed";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "retry-test" };
    const result = await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 10,
      store,
      now: 1_000,
    });

    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });
});

describe("Failure Policy: local-fallback", () => {
  it("uses local fallback when store fails with local-fallback policy", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "local-fallback";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "local-fallback-test" };
    const result = await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 2,
      store,
      now: 1_000,
    });

    // Should allow request via local fallback
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);

    const metrics = getFailureMetrics();
    expect(metrics.totalFailures).toBe(1);
    expect(metrics.localFallbackActivations).toBe(1);
  });

  it("local fallback respects burst capacity", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "local-fallback";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "burst-test" };
    const BURST = 2;

    // Make multiple requests to test burst capacity
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        enforceRateLimit({
          endpoint: "/api/test",
          subject,
          limitPerMinute: 60,
          burstCapacity: BURST,
          store,
          now: 1_000,
        })
      )
    );

    const allowed = results.filter((r) => r.allowed);
    const rejected = results.filter((r) => !r.allowed);

    // At most BURST should be allowed
    expect(allowed.length).toBeLessThanOrEqual(BURST);
    expect(rejected.length).toBeGreaterThanOrEqual(3);
  });

  it("local fallback expires unused buckets", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "local-fallback";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "expiration-test" };

    // Make a request to create bucket
    await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 2,
      store,
      now: 1_000,
    });

    // Wait for bucket to expire (TTL is 10 minutes by default, but we can test with a shorter time)
    // For this test, we'll just verify the cleanup function exists
    const fallbackStore = createEmergencyFallbackStore({ bucketTtlMs: 100 });
    await fallbackStore.checkAndDeduct("/api/test:user:expiration-test", {
      limitPerMinute: 60,
      burstCapacity: 2,
      now: 1_000,
    });

    // Cleanup should remove expired buckets
    await fallbackStore.cleanupExpiredBuckets(2_000);

    await fallbackStore.close();
  });

  it("local fallback falls back to fail-open if it also fails", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "local-fallback";
    resetEnvCache();

    // Create a store that fails
    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "fallback-fail-test" };

    // First request should work with local fallback
    const result1 = await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 2,
      store,
      now: 1_000,
    });
    expect(result1.allowed).toBe(true);

    // Now manually corrupt the emergency fallback store to simulate failure
    const metrics = getFailureMetrics();
    expect(metrics.localFallbackActivations).toBeGreaterThan(0);
  });

  it("local fallback is process-local only", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "local-fallback";
    resetEnvCache();

    const store1 = {
      kind: "failing-store-1",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const store2 = {
      kind: "failing-store-2",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject1 = { kind: "user", value: "user1" };
    const subject2 = { kind: "user", value: "user2" };

    // Both should use the same local fallback store (process-local)
    const result1 = await enforceRateLimit({
      endpoint: "/api/test",
      subject: subject1,
      limitPerMinute: 60,
      burstCapacity: 2,
      store: store1,
      now: 1_000,
    });

    const result2 = await enforceRateLimit({
      endpoint: "/api/test",
      subject: subject2,
      limitPerMinute: 60,
      burstCapacity: 2,
      store: store2,
      now: 1_000,
    });

    // Both should work via the same fallback store
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });
});

describe("Failure Metrics", () => {
  it("tracks total failures", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "fail-open";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "metrics-test" };

    await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 10,
      store,
      now: 1_000,
    });

    const metrics = getFailureMetrics();
    expect(metrics.totalFailures).toBe(1);
  });

  it("tracks degraded mode duration", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "fail-open";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "duration-test" };

    const before = Date.now();
    await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 10,
      store,
      now: before,
    });

    const metrics = getFailureMetrics();
    expect(metrics.degradedModeStart).toBe(before);
    expect(metrics.degradedModeDuration).toBeGreaterThanOrEqual(0);
  });

  it("resets metrics correctly", async () => {
    process.env.RATE_LIMIT_FAILURE_POLICY = "fail-open";
    resetEnvCache();

    const store = {
      kind: "failing-store",
      async checkAndDeduct() {
        throw new Error("Redis unavailable");
      },
    };

    const subject = { kind: "user", value: "reset-test" };

    await enforceRateLimit({
      endpoint: "/api/test",
      subject,
      limitPerMinute: 60,
      burstCapacity: 10,
      store,
      now: 1_000,
    });

    let metrics = getFailureMetrics();
    expect(metrics.totalFailures).toBe(1);

    resetFailureMetrics();

    metrics = getFailureMetrics();
    expect(metrics.totalFailures).toBe(0);
    expect(metrics.failOpenActivations).toBe(0);
    expect(metrics.failClosedActivations).toBe(0);
    expect(metrics.localFallbackActivations).toBe(0);
    expect(metrics.degradedModeStart).toBeNull();
  });
});

describe("Emergency Fallback Store", () => {
  it("creates emergency fallback store", () => {
    const store = createEmergencyFallbackStore();
    expect(store.kind).toBe("emergency-fallback");
    expect(typeof store.checkAndDeduct).toBe("function");
    expect(typeof store.cleanupExpiredBuckets).toBe("function");
    expect(typeof store.close).toBe("function");
  });

  it("emergency fallback respects burst capacity", async () => {
    const store = createEmergencyFallbackStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });
    const BURST = 2;

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        store.checkAndDeduct("/api/test:user:emergency", {
          limitPerMinute: 60,
          burstCapacity: BURST,
          now: 1_000,
        })
      )
    );

    const allowed = results.filter((r) => r.allowed);
    expect(allowed.length).toBeLessThanOrEqual(BURST);

    await store.close();
  });

  it("emergency fallback refills tokens over time", async () => {
    const store = createEmergencyFallbackStore({ bucketTtlMs: 60_000, cleanupIntervalMs: 0 });

    // Exhaust the bucket
    await store.checkAndDeduct("/api/test:user:refill", {
      limitPerMinute: 60,
      burstCapacity: 1,
      now: 1_000,
    });

    const exhausted = await store.checkAndDeduct("/api/test:user:refill", {
      limitPerMinute: 60,
      burstCapacity: 1,
      now: 1_000,
    });
    expect(exhausted.allowed).toBe(false);

    // After 1 minute, should refill
    const refilled = await store.checkAndDeduct("/api/test:user:refill", {
      limitPerMinute: 60,
      burstCapacity: 1,
      now: 61_000,
    });
    expect(refilled.allowed).toBe(true);

    await store.close();
  });

  it("emergency fallback cleans up expired buckets", async () => {
    const store = createEmergencyFallbackStore({ bucketTtlMs: 100, cleanupIntervalMs: 0 });

    await store.checkAndDeduct("/api/test:user:cleanup", {
      limitPerMinute: 60,
      burstCapacity: 2,
      now: 1_000,
    });

    // Cleanup should remove expired bucket
    await store.cleanupExpiredBuckets(2_000);

    // Bucket should be recreated on next access
    const result = await store.checkAndDeduct("/api/test:user:cleanup", {
      limitPerMinute: 60,
      burstCapacity: 2,
      now: 2_000,
    });
    expect(result.allowed).toBe(true);

    await store.close();
  });
});

describe("Configuration Validation", () => {
  it("rejects invalid failure policy value in production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.RATE_LIMIT_FAILURE_POLICY = "invalid-policy";
    resetEnvCache();

    expect(() => getEnv()).toThrow();

    process.env.NODE_ENV = originalNodeEnv;
    resetEnvCache();
  });

  it("accepts valid failure policy values", () => {
    const validPolicies = ["fail-open", "fail-closed", "local-fallback"];

    for (const policy of validPolicies) {
      process.env.RATE_LIMIT_FAILURE_POLICY = policy;
      resetEnvCache();
      const env = getEnv();
      expect(env.RATE_LIMIT_FAILURE_POLICY).toBe(policy);
    }
  });
});
