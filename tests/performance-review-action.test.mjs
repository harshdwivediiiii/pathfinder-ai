import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  performanceReviewCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/user", () => ({
  getUserByClerkId: mocks.getUserByClerkId,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    performanceReview: {
      create: mocks.performanceReviewCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { generateSelfAssessment } from "../actions/performance-review.js";

describe("generateSelfAssessment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully generates assessment when within rate limits", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          executiveSummary: "Summary",
          keyAchievements: [],
          growthAndChallenges: "Challenges",
          futureGoals: "Goals",
          managerTalkingPoints: [],
        }),
      },
    });
    mocks.performanceReviewCreate.mockResolvedValue({ id: "review-1" });

    const result = await generateSelfAssessment("Shipped feature X", "None", "Learn Rust");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "performanceReview");
    expect(mocks.performanceReviewCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });

    const result = await generateSelfAssessment("Shipped feature X", "None", "Learn Rust");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.performanceReviewCreate).not.toHaveBeenCalled();
  });
});
