/**
 * Regression test for issue #2790: the unauthenticated /api/health endpoint
 * serialized raw error.message from each dependency check, leaking internal
 * infrastructure details (connection strings, keys, Gemini internals) to
 * anyone who can reach the endpoint.
 *
 * The fix sanitizes dependency errors at the source (lib/observability/health.js):
 * full errors are logged server-side, and the public payload only carries a
 * redacted, truncated message.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRedisClient: vi.fn(),
  queryRaw: vi.fn(),
  generateContent: vi.fn(),
}));

// lib/cache/store.js pulls in lib/rate-limit/store.js, which imports the
// corrupted lib/rate-limit/mutex.js still present on upstream/main (see issue
// #2779, PR #2793). Mocking the Redis client factory avoids that parse failure
// and also lets the test control the redis check. The real in-memory cache
// store still runs for the cache check.
vi.mock("@/lib/rate-limit/store.js", () => ({
  getRedisClient: mocks.getRedisClient,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: { $queryRaw: mocks.queryRaw },
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mocks.generateContent };
    }
  },
}));

const { checkHealth } = await import("../lib/observability/health.js");

const SECRETS = {
  db: "postgresql://admin:hunter2@db.internal.example.com:5432/app?password=hunter2&ssl=true",
  redis: "Error: connect ECONNREFUSED rediss://user:secret-token@cache.internal:6379",
  ai: "404 model 'gemini-1.5-flash' not found. API key=sk-abc123",
};

describe("checkHealth error sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.queryRaw.mockResolvedValue([]);
    mocks.getRedisClient.mockRejectedValue(new Error(SECRETS.redis));
    mocks.generateContent.mockResolvedValue({});
    process.env.REDIS_URL = "rediss://user:secret-token@cache.internal:6379";
    process.env.GEMINI_API_KEY = "sk-abc123";
  });

  it("reports healthy when every dependency passes", async () => {
    mocks.getRedisClient.mockResolvedValue({ ping: vi.fn().mockResolvedValue("PONG") });

    const health = await checkHealth();

    expect(health.status).toBe("healthy");
    expect(health.dependencies.database.healthy).toBe(true);
    expect(health.dependencies.cache.healthy).toBe(true);
    expect(health.dependencies.redis.healthy).toBe(true);
    expect(health.dependencies.ai.healthy).toBe(true);
  });

  it("sanitizes the database error message and logs the raw error server-side", async () => {
    mocks.queryRaw.mockRejectedValue(new Error(`P1001 Unable to reach ${SECRETS.db}`));

    const health = await checkHealth();

    expect(health.status).toBe("degraded");
    const error = health.dependencies.database.error;
    expect(error).not.toContain("hunter2");
    expect(error).not.toContain("db.internal.example.com");
    expect(error).not.toContain("password=");
    expect(error.length).toBeLessThanOrEqual(200);
    expect(console.error).toHaveBeenCalledWith(
      "[health] database check failed:",
      expect.objectContaining({ message: expect.stringContaining("hunter2") })
    );
  });

  it("sanitizes the redis error message", async () => {
    mocks.getRedisClient.mockRejectedValue(new Error(SECRETS.redis));

    const health = await checkHealth();

    const error = health.dependencies.redis.error;
    expect(error).not.toContain("secret-token");
    expect(error).not.toContain("cache.internal");
  });

  it("sanitizes the AI check error message", async () => {
    mocks.generateContent.mockRejectedValue(new Error(SECRETS.ai));

    const health = await checkHealth();

    const error = health.dependencies.ai.error;
    expect(error).not.toContain("sk-abc123");
    expect(error).toContain("404");
  });
});
