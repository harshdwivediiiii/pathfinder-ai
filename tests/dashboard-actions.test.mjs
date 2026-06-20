import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  generateIndustryInsightData: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
    },
    industryInsight: {
      upsert: mocks.upsert,
    },
  },
}));

vi.mock("@/lib/industry-insights", async () => {
  const actual = await vi.importActual("@/lib/industry-insights.js");
  return {
    ...actual,
    generateIndustryInsightData: mocks.generateIndustryInsightData,
  };
});

import { getIndustryInsights } from "../actions/dashboard.js";

describe("getIndustryInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the cached insight when it is still fresh", async () => {
    const freshInsight = {
      industry: "technology",
      salaryRanges: [],
      nextUpdate: new Date(Date.now() + 60 * 60 * 1000),
    };

    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUnique.mockResolvedValue({
      industry: "technology",
      industryInsight: freshInsight,
    });

    await expect(getIndustryInsights()).resolves.toBe(freshInsight);
    expect(mocks.generateIndustryInsightData).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("refreshes stale insights and extends the TTL by 24 hours", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-05-27T12:00:00.000Z");
    vi.setSystemTime(now);

    try {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUnique.mockResolvedValue({
        industry: "technology",
        industryInsight: {
          industry: "technology",
          salaryRanges: [],
          nextUpdate: new Date("2026-05-26T12:00:00.000Z"),
        },
      });
      mocks.generateIndustryInsightData.mockResolvedValue({
        salaryRanges: [
          {
            role: "Software Engineer",
            min: 100000,
            max: 150000,
            median: 125000,
            location: "Remote",
            citations: [],
          },
        ],
        growthRate: 10.5,
        demandLevel: "High",
        topSkills: ["TypeScript"],
        marketOutlook: "Positive",
        keyTrends: ["AI adoption"],
        recommendedSkills: ["Next.js"],
        isGrounded: true,
      });
      mocks.upsert.mockResolvedValue({ id: "insight-1" });

      await expect(getIndustryInsights()).resolves.toEqual({ id: "insight-1" });

      expect(mocks.generateIndustryInsightData).toHaveBeenCalledWith("technology", expect.any(Object));
      expect(mocks.generateIndustryInsightData).toHaveBeenCalledWith(
        "technology",
        expect.objectContaining({ industry: "technology" })
      );
      expect(mocks.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { industry: "technology" },
          create: expect.objectContaining({
            industry: "technology",
            isGrounded: true,
          }),
          update: expect.objectContaining({
            isGrounded: true,
          }),
        })
      );

      const upsertArgs = mocks.upsert.mock.calls[0][0];
      expect(upsertArgs.create.nextUpdate).toEqual(new Date("2026-05-28T12:00:00.000Z"));
      expect(upsertArgs.update.nextUpdate).toEqual(new Date("2026-05-28T12:00:00.000Z"));
    } finally {
      vi.useRealTimers();
    }
  });
});
