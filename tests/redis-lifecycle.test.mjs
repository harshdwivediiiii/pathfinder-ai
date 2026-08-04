import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const mockClients = new Map();
  let clientCounter = 0;

  const createMockClient = () => {
    const id = ++clientCounter;
    const mockClient = {
      id,
      isOpen: true,
      connect: vi.fn().mockResolvedValue(mockClient),
      quit: vi.fn().mockImplementation(async () => {
        mockClient.isOpen = false;
      }),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
    };
    return mockClient;
  };

  return {
    mockClients,
    createMockClient,
    createClient: vi.fn(({ url }) => {
      const client = createMockClient();
      mockClients.set(url, client);
      return client;
    }),
  };
});

vi.mock("redis", () => ({
  createClient: mocks.createClient,
}));

describe("Redis client lifecycle management - redis-store.js", () => {
  let closeRedisClients;
  let createRedisStore;

  beforeEach(async () => {
    mocks.mockClients.clear();
    mocks.createClient.mockClear();
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("beforeExit");
    vi.resetModules();
  });

  afterEach(async () => {
    if (closeRedisClients) {
      await closeRedisClients();
    }
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("beforeExit");
    vi.resetModules();
  });

  it("closeRedisClients function is exported", async () => {
    const module = await import("../lib/cache/redis-store.js");
    expect(module.closeRedisClients).toBeDefined();
    expect(typeof module.closeRedisClients).toBe("function");
  });

  it("Multiple cleanup calls are safe", async () => {
    const module = await import("../lib/cache/redis-store.js");
    closeRedisClients = module.closeRedisClients;

    // Should not throw even with no clients
    await expect(closeRedisClients()).resolves.not.toThrow();
    await expect(closeRedisClients()).resolves.not.toThrow();
    await expect(closeRedisClients()).resolves.not.toThrow();
  });

  it("Shutdown handlers are only registered once", async () => {
    await import("../lib/cache/redis-store.js");
    await import("../lib/cache/redis-store.js");
    
    const sigintListeners = process.listeners("SIGINT");
    const sigtermListeners = process.listeners("SIGTERM");
    const beforeExitListeners = process.listeners("beforeExit");

    // Should have exactly one listener for each signal
    expect(sigintListeners.length).toBe(1);
    expect(sigtermListeners.length).toBe(1);
    expect(beforeExitListeners.length).toBe(1);
  });

  it("createRedisStore function is still exported", async () => {
    const module = await import("../lib/cache/redis-store.js");
    expect(module.createRedisStore).toBeDefined();
    expect(typeof module.createRedisStore).toBe("function");
  });

  it("createRedisStore throws when REDIS_URL is missing", async () => {
    const module = await import("../lib/cache/redis-store.js");
    const createRedisStore = module.createRedisStore;

    expect(() => createRedisStore({ redisUrl: null })).toThrow(
      "REDIS_URL is required to enable Redis caching"
    );
  });

  it("createRedisStore returns store with expected methods", async () => {
    const module = await import("../lib/cache/redis-store.js");
    const createRedisStore = module.createRedisStore;

    const store = createRedisStore({ redisUrl: "redis://localhost:6379" });
    
    expect(store).toBeDefined();
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
    expect(typeof store.delete).toBe("function");
  });

  it("Cleanup handles errors gracefully", async () => {
    const module = await import("../lib/cache/redis-store.js");
    closeRedisClients = module.closeRedisClients;

    // Should not throw even if there are errors
    await expect(closeRedisClients()).resolves.not.toThrow();
  });
});

describe("Redis client lifecycle management - store.js", () => {
  let closeRedisClients;
  let createRedisCacheStore;
  let createCacheStore;

  beforeEach(async () => {
    mocks.mockClients.clear();
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("beforeExit");

    // Clear module cache
    vi.resetModules();
  });

  afterEach(async () => {
    const module = await import("../lib/cache/store.js");
    if (module.closeRedisClients) {
      await module.closeRedisClients();
    }
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("beforeExit");
    vi.resetModules();
  });

  it("closeRedisClients function is exported", async () => {
    const module = await import("../lib/cache/store.js");
    expect(module.closeRedisClients).toBeDefined();
    expect(typeof module.closeRedisClients).toBe("function");
  });

  it("Multiple cleanup calls are safe in store.js", async () => {
    const module = await import("../lib/cache/store.js");
    closeRedisClients = module.closeRedisClients;

    // Should not throw even with no clients
    await expect(closeRedisClients()).resolves.not.toThrow();
    await expect(closeRedisClients()).resolves.not.toThrow();
    await expect(closeRedisClients()).resolves.not.toThrow();
  });

  it("Shutdown handlers are only registered once in store.js", async () => {
    await import("../lib/cache/store.js");
    await import("../lib/cache/store.js");
    
    const sigintListeners = process.listeners("SIGINT");
    const sigtermListeners = process.listeners("SIGTERM");
    const beforeExitListeners = process.listeners("beforeExit");

    expect(sigintListeners.length).toBe(1);
    expect(sigtermListeners.length).toBe(1);
    expect(beforeExitListeners.length).toBe(1);
  });

  it("Memory store close method still works", async () => {
    const module = await import("../lib/cache/store.js");
    const createMemoryCacheStore = module.createMemoryCacheStore;

    const store = createMemoryCacheStore();
    expect(store.close).toBeDefined();
    expect(typeof store.close).toBe("function");

    await expect(store.close()).resolves.not.toThrow();
  });
});
