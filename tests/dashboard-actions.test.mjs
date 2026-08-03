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

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
    },
    industryInsight: {
      upsert: mocks.upsert,
    },
  },
}));

vi.mock("@/lib/misc/industry-insights", async () => {
  const actual = await vi.importActual("@/lib/misc/industry-insights.js");
  return {
    ...actual,
    generateIndustryInsightData: mocks.generateIndustryInsightData,
  };
});

import { getDashboardStats, getIndustryInsights } from "../actions/dashboard.js";

describe("getDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts resumes, cover letters, and interview sessions using valid User relations", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUnique.mockResolvedValue({
      id: "db-user-1",
      clerkUserId: "user-1",
      resume: { id: "resume-1" },
      coverLetter: [{ id: "cl-1" }, { id: "cl-2" }],
      mockInterviewSessions: [{ id: "session-1" }, { id: "session-2" }, { id: "session-3" }],
    });

    const result = await getDashboardStats();

    expect(result).toEqual({
      totalResumes: 1,
      totalCoverLetters: 2,
      totalInterviews: 3,
    });

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { clerkUserId: "user-1" },
      include: {
        resume: true,
        coverLetter: true,
        mockInterviewSessions: true,
      },
    });
  });

  it("returns zeros when the user has no relations or user is missing", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUnique.mockResolvedValue(null);

    const result = await getDashboardStats();

    expect(result).toEqual({
      totalResumes: 0,
      totalCoverLetters: 0,
      totalInterviews: 0,
    });
  });

  it("rejects when the user is not authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    await expect(getDashboardStats()).rejects.toThrow("Unauthorized");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});

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
