import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    user: {
      findUnique: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => cb(mocks.db)),
  },
  generateGeminiContentStream: vi.fn(),
  enforceRateLimit: vi.fn(),
  getCachedResponse: vi.fn(),
  cacheResponse: vi.fn(),
  getPendingGenerationRequest: vi.fn(),
  setPendingGenerationRequest: vi.fn(),
  deletePendingGenerationRequest: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContentStream: mocks.generateGeminiContentStream,
}));

vi.mock("@/lib/rate-limit", () => ({
  getRateLimitIdentifier: () => ({ kind: "user", value: "user_test" }),
  enforceRateLimit: mocks.enforceRateLimit,
  buildRateLimitResponse: () => new Response("Rate limited", { status: 429 }),
}));

vi.mock("@/lib/cache/cache-service", () => ({
  getCachedResponse: mocks.getCachedResponse,
  cacheResponse: mocks.cacheResponse,
  getPendingGenerationRequest: vi.fn(async () => null),
  setPendingGenerationRequest: vi.fn(async () => {}),
  deletePendingGenerationRequest: vi.fn(async () => {}),
  getPendingGenerationRequest: mocks.getPendingGenerationRequest,
  setPendingGenerationRequest: mocks.setPendingGenerationRequest,
  deletePendingGenerationRequest: mocks.deletePendingGenerationRequest,
  getPendingGenerationRequest: vi.fn().mockResolvedValue(null),
  setPendingGenerationRequest: vi.fn().mockResolvedValue(undefined),
  deletePendingGenerationRequest: vi.fn().mockResolvedValue(undefined),
  getPendingGenerationRequest: mocks.getPendingGenerationRequest,
  setPendingGenerationRequest: mocks.setPendingGenerationRequest,
  deletePendingGenerationRequest: mocks.deletePendingGenerationRequest,
  setPendingGenerationRequest: vi.fn(),
  deletePendingGenerationRequest: vi.fn(),
}));

// We need to set up minimal env vars needed by the route
process.env.GEMINI_API_KEY = "dummy-api-key";

import { POST } from "../app/api/generate/route.js";

describe("Generate API Route Caching", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getPendingGenerationRequest.mockResolvedValue(null);

    // Default rate limit configuration (allow request)
    mocks.enforceRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      retryAfterSeconds: 0,
    });

    mocks.getPendingGenerationRequest.mockResolvedValue(null);

    // Default authenticated user
    mocks.auth.mockResolvedValue({ userId: "clerk-user-123" });

    // Mock DB user lookup
    mocks.db.user.findUnique.mockResolvedValue({
      id: "db-user-123",
      clerkUserId: "clerk-user-123",
      saveChatHistory: true,
    });

    // Mock DB conversation checks
    mocks.db.conversation.findFirst.mockResolvedValue({
      id: "conv-123",
      userId: "db-user-123",
    });

    mocks.db.message.findMany.mockResolvedValue([]);
    mocks.db.message.create.mockResolvedValue({});
    mocks.db.conversation.update.mockResolvedValue({});
  });

  it("caches new AI response using the correct restrictedPrompt cache key on cache miss", async () => {
    // 1. Setup cache miss
    mocks.getCachedResponse.mockResolvedValue(null);

    // Mock Gemini stream response
    mocks.generateGeminiContentStream.mockResolvedValue({
      stream: (async function* () {
        yield { text: () => "Mocked Gemini advice" };
      })(),
    });

    // 2. Execute Request
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt: "How do I become a software engineer?",
        conversationId: "conv-123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    // Consume stream to ensure the generation code executes completely
    const reader = response.body.getReader();
    let done = false;
    let responseText = "";
    const decoder = new TextDecoder();
    while (!done) {
      const { value, done: doneRead } = await reader.read();
      done = doneRead;
      if (value) {
        responseText += decoder.decode(value);
      }
    }

    // Verify cache response was written
    expect(mocks.cacheResponse).toHaveBeenCalledTimes(1);

    // The key used for cache storage (argument 2) should match the key queried in getCachedResponse
    expect(mocks.getCachedResponse).toHaveBeenCalledTimes(1);
    const lookupKey = mocks.getCachedResponse.mock.calls[0][1];
    expect(mocks.getCachedResponse.mock.calls.length).toBeGreaterThanOrEqual(1);
    const lookupKeys = mocks.getCachedResponse.mock.calls.map(call => call[1]);
    const storageKey = mocks.cacheResponse.mock.calls[0][1];

    expect(lookupKeys).toContain(storageKey);
    // Crucially, it must be the restrictedPrompt containing safety/context and not the raw user prompt
    expect(storageKey).not.toBe("How do I become a software engineer?");
    expect(storageKey).toContain("How do I become a software engineer?");
    expect(storageKey).toContain("Pathfinder AI"); // contains secure system/task prompt
  });

  it("returns cached response and bypasses Gemini API on cache hit", async () => {
    // 1. Setup cache hit
    mocks.getCachedResponse.mockResolvedValue("This is a cached career guide.");

    // 2. Execute Request
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt: "How do I become a software engineer?",
        conversationId: "conv-123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("HIT");

    // Consume stream
    const reader = response.body.getReader();
    let done = false;
    let responseText = "";
    const decoder = new TextDecoder();
    while (!done) {
      const { value, done: doneRead } = await reader.read();
      done = doneRead;
      if (value) {
        responseText += decoder.decode(value);
      }
    }

    // Verify SSE payload contains the cached data
    expect(responseText).toContain("This is a cached career guide.");

    // Verify Gemini content stream generator was NOT called
    expect(mocks.generateGeminiContentStream).not.toHaveBeenCalled();

    // Verify no new response was stored (cacheResponse not called)
    expect(mocks.cacheResponse).not.toHaveBeenCalled();
  });
});
