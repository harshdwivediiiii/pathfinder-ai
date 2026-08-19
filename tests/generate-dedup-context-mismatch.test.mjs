/**
 * Regression test for issue #2789: /api/generate pending-request dedup was
 * keyed by the raw prompt (promptCheck.prompt) while the AI-response cache is
 * keyed by the full restricted prompt. For the same raw prompt with different
 * conversation context, the follower waited on a pending request, then looked
 * up a cache key that was never written and errored with "No cached result
 * available. Please try again."
 *
 * This test drives two concurrent requests through the real route handler and
 * the real dedup/cache store (the @/lib/cache/cache-service module is NOT
 * mocked, so the isCreator === false branch runs for real).
 *
 * Case 1 (different context): both requests must complete (event: done) and
 *   never hit the "No cached result available" error.
 * Case 2 (identical context): the two requests must dedup to a single Gemini
 *   call, and the follower must receive the deduped/cached SSE signal.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  generateGeminiContentStream: vi.fn(),
  userFindUnique: vi.fn(),
  conversationFindFirst: vi.fn(),
  conversationUpdate: vi.fn(),
  messageCreate: vi.fn(),
  messageFindMany: vi.fn(),
  transaction: vi.fn(),
  isFeatureEnabled: vi.fn(),
  enforceRateLimit: vi.fn(),
  getRateLimitIdentifier: vi.fn(),
  buildRateLimitResponse: vi.fn(),
  preparePromptForGeneration: vi.fn(),
  buildSseErrorResponse: vi.fn(),
  resolveCorsPolicy: vi.fn(),
  buildCorsDeniedResponse: vi.fn(),
  respondError: vi.fn(),
  respondSseError: vi.fn(),
  getEnv: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContentStream: mocks.generateGeminiContentStream,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique },
    conversation: {
      findFirst: mocks.conversationFindFirst,
      update: mocks.conversationUpdate,
    },
    message: {
      create: mocks.messageCreate,
      findMany: mocks.messageFindMany,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/ai/ai-gating", () => ({
  isFeatureEnabled: mocks.isFeatureEnabled,
  isAiEnabled: vi.fn(() => true),
  assertFeatureEnabled: vi.fn(() => {}),
}));

vi.mock("@/lib/schemas/chat", () => {
  const passthrough = {
    safeParse(value) {
      return { success: true, data: value };
    },
  };
  return { chatPromptSchema: passthrough };
});

vi.mock("@/lib/schemas/forms", () => {
  class FakeSchema {
    safeParse(input) {
      if (input && typeof input.prompt === "string" && input.prompt.trim().length > 0) {
        return { success: true, data: { prompt: input.prompt.trim() } };
      }
      return {
        success: false,
        error: {
          flatten: () => ({ fieldErrors: { prompt: ["Prompt is required."] } }),
        },
      };
    }
  }
  return { chatPromptSchema: new FakeSchema() };
});

vi.mock("@/lib/security/rate-limit", () => ({
  getRateLimitIdentifier: mocks.getRateLimitIdentifier,
  enforceRateLimit: mocks.enforceRateLimit,
  buildRateLimitResponse: mocks.buildRateLimitResponse,
}));

vi.mock("@/lib/ai/prompt-guard", () => ({
  preparePromptForGeneration: mocks.preparePromptForGeneration,
  buildSseErrorResponse: mocks.buildSseErrorResponse,
}));

vi.mock("@/lib/security/cors", () => ({
  resolveCorsPolicy: mocks.resolveCorsPolicy,
  buildCorsDeniedResponse: mocks.buildCorsDeniedResponse,
}));

vi.mock("@/lib/api/error-handler", () => ({
  respondError: mocks.respondError,
  respondSseError: mocks.respondSseError,
  ERROR_CODES: {
    UNAUTHORIZED: "UNAUTHORIZED",
    USER_NOT_FOUND: "USER_NOT_FOUND",
    AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    DATABASE_ERROR: "DATABASE_ERROR",
  },
}));

vi.mock("@/lib/security/env", () => ({
  getEnv: mocks.getEnv,
}));

// NOTE: @/lib/cache/cache-service is intentionally NOT mocked. The real
// in-memory pending-request map and the real cache store run in this test so
// the isCreator === false (follower) branch is exercised for real.
//
// lib/cache/store.js pulls in lib/rate-limit/store.js, which imports the
// corrupted lib/rate-limit/mutex.js still present on upstream/main (see issue
// #2779, PR #2793). The Redis client factory is never used in the "auto"/
// memory path, so mocking it avoids that parse failure without affecting any
// cache or dedup logic under test.
vi.mock("@/lib/rate-limit/store.js", () => ({
  getRedisClient: vi.fn(),
}));

const { POST } = await import("../app/api/generate/route.js");

function buildRequest(body = { prompt: "test prompt" }) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("generate dedup key aligned with cache key", () => {
  let generationGate;
  let releaseGeneration;

  beforeEach(() => {
    generationGate = new Promise((resolve) => {
      releaseGeneration = resolve;
    });

    mocks.auth.mockResolvedValue({ userId: "clerk-user-123" });
    mocks.getEnv.mockReturnValue({ NODE_ENV: "test" });
    mocks.isFeatureEnabled.mockReturnValue(true);
    mocks.getRateLimitIdentifier.mockReturnValue({ kind: "user", value: "user_test" });
    mocks.enforceRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
      limitPerMinute: 20,
      burstCapacity: 10,
    });
    mocks.buildRateLimitResponse.mockImplementation(
      (opts) => new Response(`event: error\ndata: ${JSON.stringify(opts)}\n\n`, { status: 429 })
    );
    mocks.preparePromptForGeneration.mockImplementation((prompt) => ({
      allowed: true,
      prompt,
      status: 200,
    }));
    mocks.buildSseErrorResponse.mockImplementation(
      (message, status = 400) =>
        new Response(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`, {
          status,
          headers: { "Content-Type": "text/event-stream" },
        })
    );
    mocks.resolveCorsPolicy.mockReturnValue({ allowed: true, headers: new Headers() });
    mocks.buildCorsDeniedResponse.mockReturnValue(new Response("cors denied", { status: 403 }));
    mocks.respondError.mockImplementation(
      (code, message) =>
        new Response(JSON.stringify({ error: message || code }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
    );
    mocks.respondSseError.mockImplementation(
      () =>
        new Response("event: error\ndata: {}\n\n", {
          status: 500,
          headers: { "Content-Type": "text/event-stream" },
        })
    );
    mocks.userFindUnique.mockResolvedValue({
      id: "db-user-1",
      clerkUserId: "clerk-user-123",
      saveChatHistory: true,
      name: "Test User",
      industry: "Tech",
    });
    mocks.conversationFindFirst.mockImplementation(({ where }) =>
      Promise.resolve({ id: where.id, userId: "db-user-1" })
    );
    mocks.transaction.mockImplementation(async (fn) =>
      fn({
        user: { findUnique: mocks.userFindUnique },
        conversation: {
          findFirst: mocks.conversationFindFirst,
          update: mocks.conversationUpdate,
        },
        message: { create: mocks.messageCreate },
      })
    );
    mocks.conversationUpdate.mockResolvedValue({});
    mocks.messageCreate.mockResolvedValue({});
    mocks.messageFindMany.mockResolvedValue([]);
    // The creator's ReadableStream.start() runs at stream construction, so with
    // an instant mock generator the first POST could finish generation, cache,
    // and clean up the pending request before the second POST registers. Gate
    // generation behind a deferred so both POSTs register first and the atomic
    // dedup actually engages.
    mocks.generateGeminiContentStream.mockImplementation(async () => ({
      stream: (async function* () {
        await generationGate;
        yield { text: () => "hello " };
        yield { text: () => "world" };
      })(),
    }));
  });

  it("completes both concurrent same-prompt requests when conversation context differs", async () => {
    mocks.messageFindMany.mockImplementation(({ where }) => {
      if (where.conversationId === "conv-A") {
        return Promise.resolve([
          { role: "user", content: "I work at Acme Corp as a senior engineer" },
          { role: "assistant", content: "Let's focus on engineering leadership." },
        ]);
      }
      return Promise.resolve([
        { role: "user", content: "I am a freelance designer" },
        { role: "assistant", content: "Let's focus on growing your freelance practice." },
      ]);
    });

    const reqA = buildRequest({
      prompt: "How should I grow in my career?",
      conversationId: "conv-A",
    });
    const reqB = buildRequest({
      prompt: "How should I grow in my career?",
      conversationId: "conv-B",
    });

    const [resA, resB] = await Promise.all([POST(reqA), POST(reqB)]);
    releaseGeneration();
    const [textA, textB] = await Promise.all([resA.text(), resB.text()]);

    expect(textA).toContain("event: done");
    expect(textB).toContain("event: done");
    expect(textA).not.toContain("No cached result available. Please try again.");
    expect(textB).not.toContain("No cached result available. Please try again.");
    expect(mocks.generateGeminiContentStream).toHaveBeenCalledTimes(2);
  });

  it("dedups concurrent identical-context requests to a single generation", async () => {
    // Return a fresh array per call: the route calls recentMessages.reverse()
    // (in-place mutation), and mockResolvedValue would hand both concurrent
    // requests the same reference.
    mocks.messageFindMany.mockImplementation(() =>
      Promise.resolve([
        { role: "user", content: "I am preparing for a product manager interview" },
        { role: "assistant", content: "Great, let's build a preparation plan." },
      ])
    );

    const reqA = buildRequest({
      prompt: "How do I stand out in interviews?",
      conversationId: "conv-C",
    });
    const reqB = buildRequest({
      prompt: "How do I stand out in interviews?",
      conversationId: "conv-C",
    });

    const [resA, resB] = await Promise.all([POST(reqA), POST(reqB)]);
    releaseGeneration();
    const [textA, textB] = await Promise.all([resA.text(), resB.text()]);

    const allText = [textA, textB];
    expect(allText.filter((text) => text.includes("event: done"))).toHaveLength(2);
    expect(allText.filter((text) => text.includes('"deduped":true'))).toHaveLength(1);
    expect(mocks.generateGeminiContentStream).toHaveBeenCalledTimes(1);
  });
});
