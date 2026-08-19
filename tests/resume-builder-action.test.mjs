import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  validateAuthenticatedUser: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  decrementRateLimit: vi.fn(),
  getCachedOrFetch: vi.fn(),
  generateGeminiContent: vi.fn(),
  validateOutput: vi.fn(),
  isValidAIOutput: vi.fn(),
  resumeGenerationCreate: vi.fn(),
  handleServerError: vi.fn(),
  createErrorResponse: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/auth/user", () => ({
  getUserByClerkId: mocks.getUserByClerkId,
}));

vi.mock("@/lib/auth/auth-user", () => ({
  validateAuthenticatedUser: mocks.validateAuthenticatedUser,
}));

vi.mock("@/lib/auth/auth-errors", () => ({
  UNAUTHORIZED_RESPONSE: { unauthorized: true },
}));

vi.mock("@/lib/errors/error-handler", () => ({
  handleServerError: mocks.handleServerError,
}));

vi.mock("@/lib/action-helpers/action-errors", () => ({
  createErrorResponse: mocks.createErrorResponse,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    resumeGeneration: {
      create: mocks.resumeGenerationCreate,
    },
  },
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
  decrementRateLimit: mocks.decrementRateLimit,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/ai/ai-cache", () => ({
  getCachedOrFetch: mocks.getCachedOrFetch,
}));

vi.mock("@/lib/ai/validate", () => ({
  validateOutput: mocks.validateOutput,
}));

vi.mock("@/lib/ai/ai-validation", () => ({
  isValidAIOutput: mocks.isValidAIOutput,
}));

vi.mock("@/lib/history/history-auth", () => ({
  getHistoryUserContext: vi.fn(),
}));

vi.mock("@/lib/history/history-response", () => ({
  EMPTY_HISTORY_RESPONSE: { success: true, data: [] },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { generateResumeContent } from "../actions/resume-builder.js";

const validJobDescription =
  "Senior Full-Stack Engineer to own product features end to end, from design and implementation to testing and deployment, collaborating closely with product and design teams.";

const parsedData = {
  personalInfo: { name: "John Doe" },
  summary: "Summary",
  skills: ["JavaScript"],
  experience: [],
  education: [],
  projects: [],
};

describe("generateResumeContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-user-1" });
    mocks.validateAuthenticatedUser.mockReturnValue(true);
    mocks.isValidAIOutput.mockReturnValue(true);
    mocks.getCachedOrFetch.mockImplementation((_key, _scope, fetcher) => fetcher());
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => JSON.stringify(parsedData) },
    });
    mocks.validateOutput.mockReturnValue({ success: true, data: parsedData });
    mocks.resumeGenerationCreate.mockResolvedValue({ id: "resume-1" });
  });

  it("returns an error before consuming the rate limit when the job description is too short", async () => {
    const result = await generateResumeContent("too short");

    expect(result.success).toBe(false);
    expect(result.errors._form).toBeDefined();
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.decrementRateLimit).not.toHaveBeenCalled();
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("generates and persists resume content on valid input", async () => {
    const result = await generateResumeContent(validJobDescription);

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("clerk-1", "resumeBuilder");
    expect(mocks.resumeGenerationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "db-user-1",
          content: parsedData,
        }),
      })
    );
  });
});
