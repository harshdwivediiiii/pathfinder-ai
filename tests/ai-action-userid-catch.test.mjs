import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  decrementRateLimit: vi.fn(),
  isFeatureEnabled: vi.fn(),
  cachedGenerateGeminiContent: vi.fn(),
  generateCacheKey: vi.fn(),
  generateGeminiContent: vi.fn(),
  handleServerError: vi.fn((error) => ({
    success: false,
    errors: { _form: [error.message] },
  })),
  skillGapUpsert: vi.fn(),
  atsAnalysisCreate: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
  decrementRateLimit: mocks.decrementRateLimit,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: { findUnique: mocks.findUniqueUser },
    skillGapAnalysis: { upsert: mocks.skillGapUpsert },
    atsAnalysis: { create: mocks.atsAnalysisCreate },
  },
}));

vi.mock("@/lib/errors/error-handler", () => ({
  handleServerError: mocks.handleServerError,
}));

vi.mock("@/lib/ai/ai-gating", () => ({
  isFeatureEnabled: mocks.isFeatureEnabled,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/cache", async () => {
  const actual = await vi.importActual("@/lib/cache");
  return {
    ...actual,
    cachedGenerateGeminiContent: mocks.cachedGenerateGeminiContent,
    generateCacheKey: mocks.generateCacheKey,
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

process.env.GEMINI_API_KEY = "dummy-api-key";

import { generateSkillGapAnalysis } from "../actions/skill-gap.js";
import { analyzeATS } from "../actions/ats.js";

describe("AI action catch blocks access userId after a mid-try failure (issue 2082)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "dummy-api-key";
    mocks.isFeatureEnabled.mockResolvedValue(true);
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.formatResetTime.mockReturnValue("10m");
  });

  it("skill-gap: decrements the rate limit with the authenticated userId when AI fails", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1", skills: ["JS"] });
    mocks.generateGeminiContent.mockRejectedValue(new Error("Gemini down"));

    const result = await generateSkillGapAnalysis({
      currentSkills: "JS",
      targetRole: "Senior Dev",
    });

    expect(mocks.decrementRateLimit).toHaveBeenCalledWith("user-1", "skill-gap");
    expect(result.success).toBe(false);
    expect(result.errors._form).toEqual(["Gemini down"]);
  });

  it("skill-gap: does not throw when auth() itself fails and returns a clean error", async () => {
    mocks.auth.mockRejectedValue(new Error("Clerk outage"));

    const result = await generateSkillGapAnalysis({ currentSkills: "JS", targetRole: "Dev" });

    expect(mocks.decrementRateLimit).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.errors._form).toEqual(["Clerk outage"]);
  });

  it("ats: decrements the rate limit with the authenticated userId when AI fails", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1", skills: ["JS"] });
    mocks.generateCacheKey.mockReturnValue("ats:key-1");
    mocks.cachedGenerateGeminiContent.mockRejectedValue(new Error("Gemini down"));

    const result = await analyzeATS({
      resumeContent: "Experienced Developer",
      jobDescription: "Senior Developer role",
      jobTitle: "Senior Developer",
      companyName: "Acme",
    });

    expect(mocks.decrementRateLimit).toHaveBeenCalledWith("user-1", "ats");
    expect(result.success).toBe(false);
    expect(result.errors._form).toEqual(["Gemini down"]);
  });
});
