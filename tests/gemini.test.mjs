import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Helpers – produce SDK-shaped responses and errors
// ---------------------------------------------------------------------------

function createMockResponse(text) {
  return {
    response: {
      text: () => text,
      candidates: [{}],
    },
  };
}

function createMockError(status, message = "Error") {
  const err = new Error(message);
  err.status = status;
  err.response = { status };
  return err;
}

// ---------------------------------------------------------------------------
// Module-level mocks – vi.hoisted runs before vi.mock so the factory can
// reference the shared mock functions.
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  generateContentStream: vi.fn(),
  getGenerativeModel: vi.fn(),
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mocks.getGenerativeModel,
  })),
}));

import {
  GeminiError,
  generateGeminiContent,
  generateGeminiContentStream,
} from "../lib/gemini.js";

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-api-key");
  // Wire the model lookup so every getGenerativeModel({model:…}) returns an
  // object whose methods point at our shared mock functions.
  mocks.getGenerativeModel.mockReturnValue({
    generateContent: mocks.generateContent,
    generateContentStream: mocks.generateContentStream,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("success", () => {
  it("returns content from a successful string-prompt generation", async () => {
    expect.assertions(1);

    mocks.generateContent.mockResolvedValue(createMockResponse("Hello world"));

    const result = await generateGeminiContent("Say hello");

    expect(result.response.text()).toBe("Hello world");
  });

  it("merges requestOptions when provided alongside a string prompt", async () => {
    expect.assertions(2);

    mocks.generateContent.mockResolvedValue(createMockResponse("With options"));

    const options = { generationConfig: { temperature: 0.7 } };
    const result = await generateGeminiContent("Hello", options);

    expect(mocks.generateContent).toHaveBeenCalledWith({
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
      generationConfig: { temperature: 0.7 },
    });
    expect(result.response.text()).toBe("With options");
  });
});

describe("fallback", () => {
  it("falls back to the next model when the first is unavailable (404)", async () => {
    expect.assertions(1);

    mocks.generateContent
      .mockRejectedValueOnce(createMockError(404, "not found"))
      .mockResolvedValue(createMockResponse("Fallback response"));

    const result = await generateGeminiContent("Hi");

    expect(result.response.text()).toBe("Fallback response");
  });

  it("throws GeminiError when every model in the chain is unavailable", async () => {
    expect.assertions(1);

    mocks.generateContent.mockRejectedValue(
      createMockError(404, "not found"),
    );

    await expect(generateGeminiContent("Hi")).rejects.toThrow(GeminiError);
  });
});

describe("retry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries on 429 and succeeds on the second attempt", async () => {
    expect.assertions(1);
    vi.useFakeTimers();

    try {
      mocks.generateContent
        .mockRejectedValueOnce(createMockError(429, "rate limited"))
        .mockResolvedValue(createMockResponse("Retried OK"));

      const promise = generateGeminiContent("Hi");
      // The retry delay is ~1 000–1 500 ms (2^0 * 1000 + random 0–500)
      await vi.advanceTimersByTimeAsync(2_000);

      const result = await promise;
      expect(result.response.text()).toBe("Retried OK");
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws GeminiError with code RATE_LIMITED after exhausting all retries", async () => {
    expect.assertions(1);
    vi.useFakeTimers();

    try {
      mocks.generateContent.mockRejectedValue(
        createMockError(429, "rate limited"),
      );

      const promise = generateGeminiContent("Hi");

      // Attach the rejection handler BEFORE advancing timers so the
      // rejection is never unhandled.
      // Need to advance past multiple back-off delays:
      // attempt 0: ~1 000–1 500 ms
      // attempt 1: ~2 000–2 500 ms
      // Total: ~3 000–4 000 ms — advance 5 s to be safe.
      const onRejected = expect(promise).rejects.toMatchObject({
        code: "RATE_LIMITED",
      });
      await vi.advanceTimersByTimeAsync(5_000);
      await onRejected;
    } finally {
      vi.useRealTimers();
    }
  });

  it("retries on 503 and succeeds on the second attempt", async () => {
    expect.assertions(1);
    vi.useFakeTimers();

    try {
      mocks.generateContent
        .mockRejectedValueOnce(createMockError(503, "service unavailable"))
        .mockResolvedValue(createMockResponse("Retried OK"));

      const promise = generateGeminiContent("Hi");
      await vi.advanceTimersByTimeAsync(2_000);

      const result = await promise;
      expect(result.response.text()).toBe("Retried OK");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("timeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws GeminiError with code TIMEOUT when generation exceeds 30 s", async () => {
    expect.assertions(1);
    vi.useFakeTimers();

    try {
      // Return a promise that never settles
      mocks.generateContent.mockReturnValue(new Promise(() => {}));

      const promise = generateGeminiContent("Hi");

      // Attach rejection handler before advancing timers to keep the
      // rejection handled.
      const onRejected = expect(promise).rejects.toMatchObject({
        code: "TIMEOUT",
      });
      // Advance well past the 30 s default timeout
      await vi.advanceTimersByTimeAsync(31_000);
      await onRejected;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("signal", () => {
  it("passes AbortSignal to generateContentStream", async () => {
    expect.assertions(1);

    mocks.generateContentStream.mockResolvedValue(
      createMockResponse("streamed"),
    );

    const controller = new AbortController();
    await generateGeminiContentStream("Hi", { signal: controller.signal });

    expect(mocks.generateContentStream).toHaveBeenCalledWith("Hi", {
      signal: controller.signal,
    });
  });
});

describe("config", () => {
  it("throws GeminiError when GEMINI_API_KEY is not configured", async () => {
    expect.assertions(2);

    vi.stubEnv("GEMINI_API_KEY", "");

    await expect(generateGeminiContent("Hi")).rejects.toThrow(GeminiError);
    await expect(generateGeminiContent("Hi")).rejects.toMatchObject({
      message: expect.stringContaining("GEMINI_API_KEY"),
      code: "UNKNOWN",
    });
  });
});
