import { expect, it } from "vitest";

import { enforceRateLimit } from "../lib/rate-limit.js";
import {
  createMemoryRateLimitStore,
  createRateLimitStore,
} from "../lib/rate-limit/store.js";

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