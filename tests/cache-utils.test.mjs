import { expect, it, describe,afterEach, vi } from "vitest";
import { generateCacheKey, hashString } from "../lib/cache/utils.js";
import { createCacheStore } from "../lib/cache/store.js";

it("hashString is deterministic and truncated to a compact length", () => {
  const first = hashString("hello world");
  const second = hashString("hello world");

  expect(first).toBe(second);
  expect(first).toHaveLength(32);
});

it("generateCacheKey is stable for nested inputs", () => {
  const keyA = generateCacheKey("quiz", "technology", ["React", "Node.js"], { category: "Technical" });
  const keyB = generateCacheKey("quiz", "technology", ["React", "Node.js"], { category: "Technical" });
  const keyC = generateCacheKey("quiz", "technology", ["Node.js", "React"], { category: "Technical" });

  expect(keyA).toBe(keyB);
  expect(keyA).not.toBe(keyC);
  expect(keyA.startsWith("quiz:")).toBe(true);
});

describe("createCacheStore", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalRedisUrl = process.env.REDIS_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalRedisUrl !== undefined) {
      process.env.REDIS_URL = originalRedisUrl;
    } else {
      delete process.env.REDIS_URL;
    }
  });

  it("throws in production when REDIS_URL is missing", () => {
    process.env.NODE_ENV = "production";
    delete process.env.REDIS_URL;

    expect(() => createCacheStore({ driver: "auto" })).toThrow(
      /REDIS_URL is required in production when using Redis caching/i
    );
  });

  it("throws in production when driver is explicitly memory", () => {
    process.env.NODE_ENV = "production";
    process.env.REDIS_URL = "redis://localhost:6379";

    expect(() => createCacheStore({ driver: "memory" })).toThrow(
      /CACHE_STORE=memory is not allowed in production/i
    );
  });

  it("returns a memory store in non-production when driver is memory", () => {
    process.env.NODE_ENV = "test";
    delete process.env.REDIS_URL;

    const store = createCacheStore({ driver: "memory" });
    expect(store.kind).toBe("memory");
    expect(store).toBeDefined();
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
  });

  it("returns a redis store in non-production when REDIS_URL is provided", () => {
    process.env.NODE_ENV = "test";
    process.env.REDIS_URL = "redis://localhost:6379";

    const store = createCacheStore({ driver: "auto" });
    
    expect(store.kind).toBe("redis"); 
    expect(store).toBeDefined();
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
  });
});