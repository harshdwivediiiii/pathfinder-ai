import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  atsAnalysisCreate: vi.fn(),
  cachedGenerateGeminiContent: vi.fn(),
  generateCacheKey: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  isFeatureEnabled: vi.fn(),
  validateOutput: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    atsAnalysis: {
      create: mocks.atsAnalysisCreate,
    },
    activityLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("@/lib/cache", () => ({
  cachedGenerateGeminiContent: mocks.cachedGenerateGeminiContent,
  generateCacheKey: mocks.generateCacheKey,
  ATS_ANALYSIS_CACHE_TTL_MS: 3600000,
}));

vi.mock("@/lib/ai/ai-gating", () => ({
  isFeatureEnabled: mocks.isFeatureEnabled,
  isAiEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/ai/validate", () => ({
  validateInput: vi.fn((schema, data) => ({ success: true, data })),
  validateOutput: mocks.validateOutput,
}));

vi.mock("@/lib/ai/prompt-safety", () => ({
  buildSecurePrompt: vi.fn(() => "mocked-prompt"),
}));

vi.mock("@/lib/ai/ai-context", () => ({
  buildUserProfileContext: vi.fn(() => "mocked-context"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mocks.logActivity,
}));

process.env.GEMINI_API_KEY = "dummy-api-key";

import { analyzeATS } from "../actions/ats.js";

describe("analyzeATS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "dummy-api-key";
    mocks.isFeatureEnabled.mockReturnValue(true);
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.formatResetTime.mockReturnValue("10m");
    mocks.validateOutput.mockReturnValue({ success: true, data: {} });
  });

  it("uses cachedGenerateGeminiContent with a specific cache key", async () => {
    const rawParams = {
      resumeContent: "Experienced Developer...",
      jobDescription: "Looking for a Senior Developer...",
      jobTitle: "Senior Developer",
      companyName: "Tech Corp",
    };

    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateCacheKey.mockReturnValue("ats:test-key");
    mocks.cachedGenerateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          atsScore: 85,
          matchedKeywords: ["React", "Node.js"],
          missingKeywords: ["GraphQL"],
          suggestions: [{ category: "Skills", tip: "Add GraphQL" }],
          highlights: [
            {
              type: "weak_impact",
              text: "Experienced Developer...",
              suggestion: "Quantify your achievements."
            }
          ],
          overallFeedback: "Great match!",
        }),
      },
    });
    mocks.validateOutput.mockReturnValue({
      success: true,
      data: {
        atsScore: 85,
        matchedKeywords: ["React", "Node.js"],
        missingKeywords: ["GraphQL"],
        suggestions: [{ category: "Skills", tip: "Add GraphQL" }],
        highlights: [{ type: "weak_impact", text: "Experienced Developer...", suggestion: "Quantify your achievements." }],
        overallFeedback: "Great match!",
      },
    });
    mocks.atsAnalysisCreate.mockResolvedValue({ id: "analysis-1" });

    const result = await analyzeATS(rawParams);

    expect(result.success).toBe(true);
    expect(mocks.generateCacheKey).toHaveBeenCalledWith(
      "ats",
      "user-1",
      rawParams.resumeContent,
      rawParams.jobDescription,
      rawParams.jobTitle,
      rawParams.companyName
    );
    expect(mocks.cachedGenerateGeminiContent).toHaveBeenCalledWith(
      expect.any(String),
      {},
      expect.objectContaining({
        key: "ats:test-key",
        ttl: expect.any(Number),
      })
    );
    expect(mocks.atsAnalysisCreate).toHaveBeenCalled();
  });
});
