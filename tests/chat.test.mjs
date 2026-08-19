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
  decrementRateLimit: vi.fn(),
  handleServerError: vi.fn(),
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
  consoleError: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
  getRateLimitIdentifier: mocks.getRateLimitIdentifier,
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
  decrementRateLimit: mocks.decrementRateLimit,
}));

vi.mock("@/lib/errors/error-handler", () => ({
  handleServerError: mocks.handleServerError,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/ai/prompt-safety", async () => {
  const actual = await vi.importActual("@/lib/ai/prompt-safety");
  return {
    ...actual,
    buildSecurePrompt: mocks.buildSecurePrompt,
  };
});

// const consoleErrorSpy = vi
//   .spyOn(console, "error")
//   .mockImplementation(() => {});

import { chatWithGemini } from "../actions/chat.js";

describe("chatWithGemini", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock for auth to return no user (null userId)
    mocks.auth.mockResolvedValue({ userId: null });
    mocks.headers.mockResolvedValue(new Map());
    mocks.getRateLimitIdentifier.mockReturnValue({ kind: "ip", value: "127.0.0.1" });
    mocks.enforceRateLimit.mockResolvedValue({ allowed: true, remaining: 10, retryAfterSeconds: 0 });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19, resetAt: new Date() });
    mocks.formatResetTime.mockReturnValue("less than a minute");
    mocks.handleServerError.mockImplementation((error, action) => {
      console.error(`[Server Action Error] ${action}:`, error);
      return {
        success: false,
        errors: { _form: ["An unexpected error occurred. Our team has been notified."] },
      };
    });
    mocks.db.user.findUnique.mockResolvedValue({
      id: "db-user-1",
      clerkUserId: "clerk-user-123",
      name: "Test User",
      industry: "Tech",
    });
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

  it("enforces rate limits", async () => {
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

  it("consumes only the per-user hourly bucket for authenticated users", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-123" });
    mocks.buildSecurePrompt.mockReturnValue("secure prompt");
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => "career advice" },
    });

    await expect(chatWithGemini("How do I prepare for interviews?")).resolves.toEqual({
      success: true,
      data: "career advice",
    });

    expect(mocks.checkRateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("clerk-user-123", "chat");
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(mocks.generateGeminiContent).toHaveBeenCalledTimes(1);
  });

  it("blocks authenticated users when the per-user hourly limit is exhausted", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-123" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: new Date() });

    await expect(chatWithGemini("Hello")).resolves.toEqual({
      success: false,
      errors: { _form: ["Chat limit reached. Resets in less than a minute."] },
    });
    expect(mocks.checkRateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("consumes only the per-IP bucket for anonymous users", async () => {
    mocks.buildSecurePrompt.mockReturnValue("secure prompt");
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => "career advice" },
    });

    await expect(chatWithGemini("Hello")).resolves.toEqual({
      success: true,
      data: "career advice",
    });

    expect(mocks.enforceRateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("wraps the prompt before sending it to Gemini", async () => {
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