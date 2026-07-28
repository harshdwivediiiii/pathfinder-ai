import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  generateGeminiContent: vi.fn(),
  buildSecurePrompt: vi.fn(),
  auth: vi.fn(),
  headers: vi.fn(),
  enforceRateLimit: vi.fn(),
  getRateLimitIdentifier: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
  validateInput: null, // set in mock factory using vi.importActual
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
  getRateLimitIdentifier: mocks.getRateLimitIdentifier,
}));

vi.mock("@/lib/security/rate-limit-actions.js", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/ai/prompt-safety.js", () => ({
  buildSecurePrompt: mocks.buildSecurePrompt,
}));

vi.mock("@/lib/ai/validate.js", async () => {
  const actual = await vi.importActual("@/lib/ai/validate.js");
  mocks.validateInput = actual.validateInput;
  return actual;
});

import { chatWithGemini } from "../actions/chat.js";

describe("chatWithGemini", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock for auth to return no user (null userId)
    mocks.auth.mockResolvedValue({ userId: null });
    mocks.headers.mockResolvedValue(new Map());
    mocks.getRateLimitIdentifier.mockReturnValue({ kind: "ip", value: "127.0.0.1" });
    mocks.enforceRateLimit.mockResolvedValue({ allowed: true, remaining: 10, retryAfterSeconds: 0 });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.formatResetTime.mockReturnValue("10m");
  });

  it("returns validation errors for an empty prompt", async () => {
    await expect(chatWithGemini("")).resolves.toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          prompt: expect.any(Array),
        }),
      })
    );
  });

  it("rejects whitespace-only prompts", async () => {
  await expect(chatWithGemini("   ")).resolves.toEqual(
    expect.objectContaining({
      success: false,
      errors: expect.objectContaining({
        prompt: expect.any(Array),
        }),
      })
    );
  });

  it.skip("enforces rate limits", async () => {
    mocks.enforceRateLimit.mockResolvedValue({ 
      allowed: false, 
      remaining: 0, 
      retryAfterSeconds: 60 
    });

    await expect(chatWithGemini("Hello")).resolves.toEqual({
      success: false,
      errors: { _form: ["Rate limit exceeded. Try again in 60s."] },
    });
    expect(mocks.enforceRateLimit).toHaveBeenCalled();
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it.skip("wraps the prompt before sending it to Gemini", async () => {
    mocks.buildSecurePrompt.mockReturnValue("secure prompt");
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => "career advice" },
    });

    await expect(chatWithGemini("How do I improve my resume?")).resolves.toEqual({
      success: true,
      data: "career advice",
    });

    expect(mocks.buildSecurePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        untrustedData: [
          {
            label: "userQuery",
            value: "How do I improve my resume?",
            maxLength: 4000,
          },
        ],
      })
    );
    expect(mocks.generateGeminiContent).toHaveBeenCalledWith("secure prompt");
  });

  it("normalizes Gemini errors", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.buildSecurePrompt.mockReturnValue("secure prompt");
    mocks.generateGeminiContent.mockRejectedValue(new Error("quota exceeded"));

    await expect(chatWithGemini("Help me with interviews")).resolves.toEqual({
      success: false,
      errors: { _form: ["An unexpected error occurred. Our team has been notified."] },
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});