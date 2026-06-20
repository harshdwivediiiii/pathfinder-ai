import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  buildSecurePrompt: vi.fn((input) => `secure:${input.untrustedData[0].value}`),
  cachedGenerateGeminiContent: vi.fn(),
}));

vi.mock("@/lib/prompt-safety", async () => {
  const actual = await vi.importActual("@/lib/prompt-safety");
  return {
    ...actual,
    buildSecurePrompt: mocks.buildSecurePrompt,
  };
});

vi.mock("../lib/cache/index.js", async () => {
  const actual = await vi.importActual("../lib/cache/index.js");

  return {
    ...actual,
    cachedGenerateGeminiContent: mocks.cachedGenerateGeminiContent,
  };
});

import {
  generateIndustryInsightData,
  isIndustryInsightStale,
} from "../lib/industry-insights.js";

describe("industry insights helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ensures no user context is passed to the prompt builder", async () => {
    mocks.cachedGenerateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          salaryRanges: [{ role: "Role", min: 1, max: 2, median: 1.5, location: "Loc" }],
          growthRate: 1,
          demandLevel: "High",
          topSkills: ["A"],
          marketOutlook: "Positive",
          keyTrends: ["B"],
          recommendedSkills: ["C"],
        }),
      },
    });

    await generateIndustryInsightData("technology");

    // buildSecurePrompt is called by buildIndustryInsightPrompt
    // We check that it was called with clean context
    expect(mocks.buildSecurePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.stringContaining("Industry Context:"),
      })
    );
    expect(mocks.buildSecurePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.not.stringContaining("User Profile Context:"),
      })
    );
  });

  it("uses grounded sources when Gemini search succeeds", async () => {
    mocks.cachedGenerateGeminiContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            salaryRanges: [
              {
                role: "Software Engineer",
                min: 100000,
                max: 150000,
                median: 125000,
                location: "Remote",
              },
            ],
            growthRate: 11.5,
            demandLevel: "High",
            topSkills: ["TypeScript", "React"],
            marketOutlook: "Positive",
            keyTrends: ["AI adoption"],
            recommendedSkills: ["Next.js"],
          }),
        candidates: [
          {
            groundingMetadata: {
              groundingChunks: [
                { web: { uri: "https://example.com/salary-a", title: "Salary A" } },
                { web: { uri: "https://example.com/salary-a", title: "Salary A duplicate" } },
                { web: { uri: "https://example.com/salary-b", title: "Salary B" } },
              ],
            },
          },
        ],
      },
    });

    const insights = await generateIndustryInsightData("technology");

    expect(insights.isGrounded).toBe(true);
    expect(insights.salaryRanges[0].citations).toHaveLength(2);
    expect(insights.salaryRanges[0].citations[0]).toEqual({
      title: "Salary A",
      uri: "https://example.com/salary-a",
    });
    expect(mocks.cachedGenerateGeminiContent).toHaveBeenCalledWith(
      "secure:technology",
      expect.objectContaining({
        tools: [{ googleSearchRetrieval: {} }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      expect.objectContaining({
        key: expect.stringMatching(/^industry:/),
        ttl: 5 * 60 * 1000,
      })
    );
  });

  it("falls back to an estimate when grounded search fails", async () => {
    mocks.cachedGenerateGeminiContent
      .mockRejectedValueOnce(new Error("search unavailable"))
      .mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              salaryRanges: [
                {
                  role: "Software Engineer",
                  min: 90000,
                  max: 130000,
                  median: 110000,
                  location: "Remote",
                },
              ],
              growthRate: 9.1,
              demandLevel: "Medium",
              topSkills: ["JavaScript"],
              marketOutlook: "Neutral",
              keyTrends: ["Automation"],
              recommendedSkills: ["TypeScript"],
            }),
          candidates: [{}],
        },
      });

    const insights = await generateIndustryInsightData("finance");

    expect(insights.isGrounded).toBe(false);
    expect(insights.salaryRanges[0].citations).toEqual([]);
    expect(mocks.cachedGenerateGeminiContent).toHaveBeenNthCalledWith(
      1,
      "secure:finance",
      expect.objectContaining({
        tools: [{ googleSearchRetrieval: {} }],
      }),
      expect.objectContaining({
        key: expect.stringMatching(/^industry:/),
        ttl: 5 * 60 * 1000,
      })
    );
    expect(mocks.cachedGenerateGeminiContent).toHaveBeenNthCalledWith(
      2,
      "secure:finance",
      expect.objectContaining({
        generationConfig: { responseMimeType: "application/json" },
      }),
      expect.objectContaining({
        key: expect.stringMatching(/^industry:/),
        ttl: 5 * 60 * 1000,
      })
    );
  });

  it("treats missing nextUpdate as stale", () => {
    expect(isIndustryInsightStale(null)).toBe(true);
    expect(isIndustryInsightStale({ nextUpdate: null })).toBe(true);
    expect(isIndustryInsightStale({ nextUpdate: new Date(Date.now() + 60_000) })).toBe(false);
    expect(isIndustryInsightStale({ nextUpdate: new Date(Date.now() - 60_000) })).toBe(true);
  });
});
