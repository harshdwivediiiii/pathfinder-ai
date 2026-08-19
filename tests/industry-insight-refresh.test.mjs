import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  generateIndustryInsightData: vi.fn(),
  getIndustryInsightRefreshTime: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("../lib/misc/industry-insights.js", () => ({
  generateIndustryInsightData: mocks.generateIndustryInsightData,
  getIndustryInsightRefreshTime: mocks.getIndustryInsightRefreshTime,
}));

import {
  buildIndustryInsightFields,
  refreshIndustryInsight,
} from "../lib/misc/industry-insight-refresh.js";

describe("industry insight refresh service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getIndustryInsightRefreshTime.mockReturnValue(new Date("2026-08-07T00:00:00.000Z"));
  });

  it("builds persistence fields from an insight snapshot", () => {
    const fields = buildIndustryInsightFields(
      {
        salaryRanges: [{ role: "Eng", min: 1, max: 2, median: 1.5, location: "Remote" }],
        growthRate: 10,
        demandLevel: "High",
        topSkills: ["JS"],
        marketOutlook: "Positive",
        keyTrends: ["AI"],
        recommendedSkills: ["TS"],
        isGrounded: true,
      },
      new Date("2026-08-06T00:00:00.000Z")
    );

    expect(fields).toMatchObject({
      growthRate: 10,
      demandLevel: "High",
      isGrounded: true,
      lastUpdated: new Date("2026-08-06T00:00:00.000Z"),
      nextUpdate: new Date("2026-08-07T00:00:00.000Z"),
    });
  });

  it("generates and upserts insights for a selected industry", async () => {
    const insights = {
      salaryRanges: [{ role: "Eng", min: 1, max: 2, median: 1.5, location: "Remote" }],
      growthRate: 8,
      demandLevel: "Medium",
      topSkills: ["Python"],
      marketOutlook: "Neutral",
      keyTrends: ["Cloud"],
      recommendedSkills: ["SQL"],
      isGrounded: false,
    };
    mocks.generateIndustryInsightData.mockResolvedValue(insights);
    mocks.upsert.mockResolvedValue({ industry: "healthcare", ...insights });

    const db = {
      industryInsight: {
        upsert: mocks.upsert,
      },
    };

    const result = await refreshIndustryInsight(db, "  healthcare  ");

    expect(mocks.generateIndustryInsightData).toHaveBeenCalledWith("healthcare");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { industry: "healthcare" },
        create: expect.objectContaining({ industry: "healthcare", isGrounded: false }),
        update: expect.objectContaining({ isGrounded: false }),
      })
    );
    expect(result.industry).toBe("healthcare");
    expect(result.insights).toEqual(insights);
  });

  it("rejects an empty industry argument", async () => {
    await expect(refreshIndustryInsight({ industryInsight: { upsert: mocks.upsert } }, "  ")).rejects.toThrow(
      "Industry is required"
    );
    expect(mocks.generateIndustryInsightData).not.toHaveBeenCalled();
  });
});
