import { afterEach, describe, expect, it } from "vitest";

import { cleanupExpiredBuckets, enforceRateLimit } from "../lib/rate-limit.js";
import {
  createMemoryRateLimitStore,
  createRateLimitStore,
  createRedisRateLimitStore,
  DEFAULT_BUCKET_TTL_MS,
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
    eval(_script, { keys, arguments: args }) {
      const key = keys[0];
      const now = Number(args[0]);
      const limitPerMinute = Number(args[1]);
      const burstCapacity = Number(args[2]);

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
        tokens = burstCapacity;
        lastRefillAt = now;
      }

      const elapsedMinutes = (now - lastRefillAt) / 60000;
      tokens = Math.min(burstCapacity, tokens + elapsedMinutes * limitPerMinute);
      lastRefillAt = now;

      let allowed = 0;
      let retryAfterSeconds = 0;

      if (tokens >= 1) {
        tokens -= 1;
        allowed = 1;
      } else {
        const missingTokens = 1 - tokens;
        retryAfterSeconds =
          limitPerMinute > 0
            ? Math.max(1, Math.ceil((missingTokens / limitPerMinute) * 60))
            : 60;
      }

      data.set(
        key,
        JSON.stringify({ tokens, lastRefillAt, limitPerMinute, burstCapacity })
      );

      return [allowed, Math.floor(tokens), retryAfterSeconds];
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