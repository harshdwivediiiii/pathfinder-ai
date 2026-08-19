import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  coverLetterCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  getCachedOrFetch: vi.fn(async (_promptKey, _feature, fetchFn) => fetchFn()),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  decrementRateLimit: vi.fn(),
  handleServerError: vi.fn((error) => ({
    success: false,
    errors: { _form: [error.message] },
  })),
  createErrorResponse: vi.fn((message) => ({ success: false, errors: { _form: [message] } })),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    coverLetter: {
      create: mocks.coverLetterCreate,
    },
  },
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/ai/ai-cache", () => ({
  getCachedOrFetch: mocks.getCachedOrFetch,
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  decrementRateLimit: mocks.decrementRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("@/lib/errors/error-handler", () => ({
  handleServerError: mocks.handleServerError,
}));

vi.mock("@/lib/action-helpers/action-errors", () => ({
  createErrorResponse: mocks.createErrorResponse,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { generateCoverLetter } from "../actions/cover-letter.js";

const validInput = {
  jobTitle: "Software Engineer",
  companyName: "Acme Corp",
  jobDescription: "Build and maintain scalable web applications for our customers.",
};

describe("generateCoverLetter rate-limit handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the reset message and does not refund the rate limit when denied", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date(Date.now() + 3600000) });
    mocks.formatResetTime.mockReturnValue("60 minutes");

    const result = await generateCoverLetter(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain("limit reached");
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.decrementRateLimit).not.toHaveBeenCalled();
    expect(mocks.coverLetterCreate).not.toHaveBeenCalled();
  });

  it("generates and persists a cover letter on the happy path", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({
      id: "db-user-1",
      clerkUserId: "user-1",
      name: "Test User",
      industry: "Technology",
      experience: 3,
      skills: ["JavaScript", "React"],
      bio: "A passionate developer.",
    });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          greeting: "Dear Hiring Manager,",
          body: "I am excited to apply for the Software Engineer position at Acme Corp. My experience building scalable web applications makes me a strong fit for this role.",
          closing: "Sincerely,\nTest User",
        }),
      },
    });
    mocks.coverLetterCreate.mockResolvedValue({ id: "cl-1", isFallback: false });

    const result = await generateCoverLetter(validInput);

    expect(result.id).toBe("cl-1");
    expect(result.isFallback).toBe(false);
    expect(mocks.coverLetterCreate).toHaveBeenCalledTimes(1);
  });
});
