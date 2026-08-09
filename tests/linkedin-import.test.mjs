import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  validateAuthenticatedUser: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  decrementRateLimit: vi.fn(),
  generateGeminiContent: vi.fn(),
  validateOutput: vi.fn(),
  isValidAIOutput: vi.fn(),
  industryInsightUpsert: vi.fn(),
  userUpdate: vi.fn(),
  resumeUpsert: vi.fn(),
  transaction: vi.fn(),
  getIndustryInsightRefreshTime: vi.fn(),
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
    user: {
      update: mocks.userUpdate,
    },
    resume: {
      upsert: mocks.resumeUpsert,
    },
    industryInsight: {
      upsert: mocks.industryInsightUpsert,
    },
    $transaction: mocks.transaction,
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

vi.mock("@/lib/ai/validate", () => ({
  validateOutput: mocks.validateOutput,
}));

vi.mock("@/lib/ai/ai-validation", () => ({
  isValidAIOutput: mocks.isValidAIOutput,
}));

vi.mock("@/lib/misc/industry-insights", () => ({
  getIndustryInsightRefreshTime: mocks.getIndustryInsightRefreshTime,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { importLinkedInProfile } from "../actions/linkedin-import.js";

const validExtractedText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const aiData = {
  bio: "A short professional bio.",
  currentRole: "Software Engineer",
  industry: "Software Engineering",
  experience: 5,
  skills: ["JavaScript", "React"],
  resumeContent: {
    personalInfo: { name: "John Doe" },
    summary: "Summary",
    skills: ["JavaScript"],
    experience: [],
    education: [],
    projects: [],
  },
};

describe("importLinkedInProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
    mocks.getIndustryInsightRefreshTime.mockReturnValue(new Date("2027-01-01T00:00:00.000Z"));
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.validateAuthenticatedUser.mockReturnValue(true);
    mocks.isValidAIOutput.mockReturnValue(true);
    mocks.transaction.mockImplementation((cb) =>
      cb({
        user: { update: mocks.userUpdate },
        industryInsight: { upsert: mocks.industryInsightUpsert },
      })
    );
    mocks.userUpdate.mockResolvedValue({ id: "db-user-1" });
    mocks.resumeUpsert.mockResolvedValue({ id: "resume-1" });
    mocks.industryInsightUpsert.mockResolvedValue({ id: "insight-1", industry: "Software Engineering" });
  });

  it("claims an IndustryInsight row and updates the user in one transaction for a first-time importer", async () => {
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-user-1", industry: null });
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => JSON.stringify(aiData) },
    });
    mocks.validateOutput.mockReturnValue({ success: true, data: aiData });

    const result = await importLinkedInProfile(validExtractedText);

    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    // The IndustryInsight row is upserted inside the transaction before the
    // profile update, so the FK from User.industry never dangles.
    expect(mocks.industryInsightUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { industry: "Software Engineering" },
        create: expect.objectContaining({
          industry: "Software Engineering",
          growthRate: 0,
          demandLevel: "Medium",
          topSkills: [],
          marketOutlook: expect.any(String),
          keyTrends: [],
          recommendedSkills: [],
          nextUpdate: mocks.getIndustryInsightRefreshTime(),
        }),
      })
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "db-user-1" },
        data: expect.objectContaining({
          industry: "Software Engineering",
          currentRole: "Software Engineer",
        }),
      })
    );
  });

  it("falls back to the user's existing industry when the AI output omits one", async () => {
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-user-1", industry: "Existing Industry" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => JSON.stringify({ ...aiData, industry: null }) },
    });
    mocks.validateOutput.mockReturnValue({
      success: true,
      data: { ...aiData, industry: null },
    });

    const result = await importLinkedInProfile(validExtractedText);

    expect(result.success).toBe(true);
    expect(mocks.industryInsightUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { industry: "Existing Industry" },
      })
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "db-user-1" },
        data: expect.objectContaining({
          industry: "Existing Industry",
        }),
      })
    );
  });

  it("does not set an industry when neither the AI output nor the user has one", async () => {
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-user-1", industry: null });
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => JSON.stringify({ ...aiData, industry: null }) },
    });
    mocks.validateOutput.mockReturnValue({
      success: true,
      data: { ...aiData, industry: null },
    });

    const result = await importLinkedInProfile(validExtractedText);

    expect(result.success).toBe(true);
    expect(mocks.industryInsightUpsert).not.toHaveBeenCalled();
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "db-user-1" },
        data: expect.not.objectContaining({
          industry: expect.anything(),
        }),
      })
    );
  });
});
