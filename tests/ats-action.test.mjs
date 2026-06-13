import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  cachedGenerateGeminiContent: vi.fn(),
  generateCacheKey: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
    },
    atsAnalysis: {
      create: mocks.create,
    },
    aiRateLimit: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/cache", async () => {
  const actual = await vi.importActual("@/lib/cache");
  return {
    ...actual,
    cachedGenerateGeminiContent: mocks.cachedGenerateGeminiContent,
    generateCacheKey: mocks.generateCacheKey,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { analyzeATS } from "../actions/ats.js";

describe("analyzeATS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses cachedGenerateGeminiContent with a specific cache key", async () => {
    const rawParams = {
      resumeContent: "Experienced Developer...",
      jobDescription: "Looking for a Senior Developer...",
      jobTitle: "Senior Developer",
      companyName: "Tech Corp",
    };

    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUnique.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
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
    mocks.create.mockResolvedValue({ id: "analysis-1" });

    const result = await analyzeATS(rawParams);

    expect(result.success).toBe(true);
    expect(mocks.generateCacheKey).toHaveBeenCalledWith(
      "ats",
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
    expect(mocks.create).toHaveBeenCalled();
  });
});
