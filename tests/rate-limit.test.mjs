import { afterEach, describe, expect, it } from "vitest";

import { cleanupExpiredBuckets, enforceRateLimit } from "../lib/rate-limit.js";
import {
  createMemoryRateLimitStore,
  createRateLimitStore,
  createRedisRateLimitStore,
  DEFAULT_BUCKET_TTL_MS,
  withDefaultCheckAndDeduct,
} from "../lib/rate-limit/store.js";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_REDIS_URL = process.env.REDIS_URL;

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  if (ORIGINAL_REDIS_URL == null) {
    delete process.env.REDIS_URL;
  } else {
    process.env.REDIS_URL = ORIGINAL_REDIS_URL;
  }
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
    async set(key, value) {
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

  expect(await store.getBucket("/api/generate:user:1")).toBeNull();
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

it("factory fails fast in production when REDIS_URL is missing", () => {
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
  const bucket = await store.getBucket("/api/generate:user:1", 2000);
  expect(bucket).toBeNull();

  // Verify it was actually deleted from internal storage
  expect(await store.getBucket("/api/generate:user:1")).toBeNull();

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
  const bucket = await store.getBucket("/api/generate:user:1");
  expect(bucket).toBeNull();

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

  expect(await store.getBucket("/api/generate:user:stale")).toBeNull();

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

  const bucket = await store.getBucket("/api/generate:user:fresh");
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
    const bucket = await store.getBucket(key, 1_000);
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
        if (!bucket) return null;
        if (now >= bucket.lastRefillAt + 60_000) {
          this.data.delete(key);
          return null;
        }
        return bucket;
      },
      async setBucket(key, bucket) {
        this.data.set(key, bucket);
        return true;
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
