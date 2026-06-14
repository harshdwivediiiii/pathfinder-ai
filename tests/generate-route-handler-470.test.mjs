/**
 * Regression test for issue #470: uncached chat generation crashed with
 * `TypeError: Assignment to constant variable` because `cacheUser` was
 * declared with `const` on line 222 of `app/api/generate/route.js` and
 * then reassigned on line 328 of the same handler.
 *
 * This test exercises the uncached happy path end-to-end:
 *   1. auth() returns a real userId
 *   2. getCachedResponse returns null       (cache miss)
 *   3. getPendingGenerationRequest returns null (no dedup)
 *   4. generateGeminiContentStream yields at least one chunk and then completes
 *
 * If the `const` regression returns, the test fails (RED).
 * After changing the declaration to `let`, the test passes (GREEN).
 */
import { afterEach, expect, it, vi } from "vitest";

// --- Module mocks (must run before importing the route handler) ---

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "user_test_470" })),
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContentStream: vi.fn(async () => ({
    stream: (async function* () {
      yield { text: () => "hello " };
      yield { text: () => "world" };
    })(),
  })),
}));

vi.mock("@/lib/prisma", () => {
  const db = {
    user: {
      findUnique: vi.fn(async ({ where }) => ({
        id: "db_user_1",
        clerkUserId: where.clerkUserId,
        saveChatHistory: true,
      })),
    },
    conversation: {
      findFirst: vi.fn(async () => null),
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
    },
    message: {
      create: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
    },
    $transaction: vi.fn(async (fn) => fn({ user: { findUnique: vi.fn() }, conversation: { findFirst: vi.fn() }, message: { create: vi.fn() } })),
  };
  return { db };
});

vi.mock("@/lib/ai-gating", () => ({
  isFeatureEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/cache/cache-service", () => ({
  getCachedResponse: vi.fn(async () => null),
  cacheResponse: vi.fn(async () => {}),
  buildCacheKey: vi.fn((user, prompt) => `${user}::${prompt}`),
  getPendingGenerationRequest: vi.fn(async () => null),
  setPendingGenerationRequest: vi.fn(() => {}),
  deletePendingGenerationRequest: vi.fn(() => {}),
}));

// Mock BOTH schemas the route imports.
// lib/schemas/forms.js exposes chatPromptSchema (object schema) — used by lib/schemas/forms.js only inside lib/validate.
// lib/schemas/chat.js exposes chatPromptSchemaStr (string schema) — used directly by the route handler (line 201).
vi.mock("@/lib/schemas/chat", () => {
  // The route imports this as `chatPromptSchemaStr`: `import { chatPromptSchema as chatPromptSchemaStr } from "@/lib/schemas/chat";`
  const passthroughString = {
    safeParse(value) {
      return { success: true, data: value };
    },
  };
  return { chatPromptSchema: passthroughString };
});

vi.mock("@/lib/schemas/forms", () => {
  class FakeSchema {
    safeParse(input) {
      // Mirror lib/validate.js: pass-through after minimal sanitation check.
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
  return {
    chatPromptSchema: new FakeSchema(),
    coverLetterInputSchema: new FakeSchema(),
    quizCategorySchema: new FakeSchema(),
    quizResultSaveSchema: new FakeSchema(),
    userProfileSchema: new FakeSchema(),
  };
});

vi.mock("@/lib/rate-limit", () => ({
  getRateLimitIdentifier: vi.fn(() => ({ kind: "user", value: "user_test_470" })),
  enforceRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 19,
    limitPerMinute: 20,
    burstCapacity: 10,
  })),
  buildRateLimitResponse: vi.fn(() => new Response("rate limited", { status: 429 })),
}));

vi.mock("@/lib/prompt-guard", () => ({
  preparePromptForGeneration: vi.fn((prompt) => ({
    allowed: true,
    prompt,
    status: 200,
  })),
  buildSseErrorResponse: vi.fn(
    (message, status = 400) =>
      new Response(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`, {
        status,
        headers: { "Content-Type": "text/event-stream" },
      })
  ),
}));

vi.mock("@/lib/cors", () => ({
  resolveCorsPolicy: vi.fn(() => ({
    allowed: true,
    headers: new Headers(),
  })),
  buildCorsDeniedResponse: vi.fn(
    () => new Response("cors denied", { status: 403 })
  ),
}));

vi.mock("@/lib/api/error-handler", () => ({
  respondError: vi.fn(
    (code, message) =>
      new Response(JSON.stringify({ error: message || code }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
  ),
  respondSseError: vi.fn(
    () =>
      new Response("event: error\ndata: {}\n\n", {
        status: 500,
        headers: { "Content-Type": "text/event-stream" },
      })
  ),
  ERROR_CODES: {
    UNAUTHORIZED: "UNAUTHORIZED",
    USER_NOT_FOUND: "USER_NOT_FOUND",
    AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    DATABASE_ERROR: "DATABASE_ERROR",
  },
}));

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({ NODE_ENV: "test" })),
}));

// --- Imports under test (after all vi.mock calls) ---

const { POST } = await import("../app/api/generate/route.js");

// --- Helpers ---

function buildRequest(body = { prompt: "test prompt" }, headers = {}) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// --- Tests ---

afterEach(() => {
  vi.clearAllMocks();
});

it("returns a streamed SSE response for uncached generation (issue #470 regression)", async () => {
  const req = buildRequest();

  const res = await POST(req);

  // The bug surfaces as TypeError raised synchronously from the handler.
  expect(res).toBeInstanceOf(Response);
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toMatch(/text\/event-stream/);

  const text = await res.text();
  // The handler must produce delta chunks from the Gemini stream
  expect(text).toContain("event: delta");
  expect(text).toContain("hello ");
  expect(text).toContain("world");
  // And end with the done event
  expect(text).toContain("event: done");
});
