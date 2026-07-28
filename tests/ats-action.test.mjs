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
  validateInput: null, // set via vi.importActual in async mock
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", async () => {
  const actual = await vi.importActual("@/lib/db/prisma");
  return {
    ...actual,
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
  };
});

vi.mock("@/lib/security/rate-limit-actions.js", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("@/lib/cache", () => ({
  cachedGenerateGeminiContent: mocks.cachedGenerateGeminiContent,
  generateCacheKey: mocks.generateCacheKey,
  ATS_ANALYSIS_CACHE_TTL_MS: 3600000,
  DEFAULT_CACHE_TTL_MS: 600000,
  getCacheStore: vi.fn(() => ({ get: vi.fn(() => Promise.resolve(null)), set: vi.fn(() => Promise.resolve()) })),
  getOrCreatePendingRequest: vi.fn(),
  deletePendingRequest: vi.fn(),
}));

vi.mock("@/lib/ai/ai-gating", () => ({
  isFeatureEnabled: mocks.isFeatureEnabled,
  isAiEnabled: vi.fn(() => true),
}));

// Use vi.importActual so validateInput calls the REAL implementation
vi.mock("@/lib/ai/validate.js", async () => {
  const actual = await vi.importActual("@/lib/ai/validate.js");
  mocks.validateInput = actual.validateInput;
  return {
    ...actual,
    validateInput: actual.validateInput,
    validateOutput: mocks.validateOutput,
  };
});

vi.mock("@/lib/ai/prompt-safety.js", () => ({
  buildSecurePrompt: vi.fn(() => "mocked-prompt"),
  parseAIJson: vi.fn(),
}));

vi.mock("@/lib/ai/ai-context.js", () => ({
  buildUserProfileContext: vi.fn(() => "mocked-context"),
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: vi.fn(() => Promise.resolve({
    response: {
      text: () => JSON.stringify({
        atsScore: 85,
        matchedKeywords: ["React", "Node.js"],
        missingKeywords: ["GraphQL"],
        suggestions: [{ category: "Skills", tip: "Add GraphQL" }],
        highlights: [{ type: "weak_impact", text: "Experienced Developer...", suggestion: "Quantify your achievements." }],
        overallFeedback: "Great match!",
      }),
    },
  })),
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
