import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAuthenticatedHistoryUser: vi.fn(),
  assignmentGradeCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/history-auth", () => ({
  getAuthenticatedHistoryUser: mocks.getAuthenticatedHistoryUser,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    assignmentGrade: {
      create: mocks.assignmentGradeCreate,
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

import { gradeAssignment } from "../actions/assignment.js";

describe("gradeAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully grades assignment when within rate limits", async () => {
    mocks.getAuthenticatedHistoryUser.mockResolvedValue({ id: "db-user-1" });
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          score: 90,
          overallFeedback: "Great solution",
          strengths: [],
          edgeCasesMissed: [],
          optimizations: [],
          finalVerdict: "Pass",
        }),
      },
    });
    mocks.assignmentGradeCreate.mockResolvedValue({ id: "grade-1" });

    const result = await gradeAssignment("Design a rate limiter", "Use Redis token bucket");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "assignment");
    expect(mocks.assignmentGradeCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.getAuthenticatedHistoryUser.mockResolvedValue({ id: "db-user-1" });
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });

    const result = await gradeAssignment("Design a rate limiter", "Use Redis token bucket");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.assignmentGradeCreate).not.toHaveBeenCalled();
  });
});
