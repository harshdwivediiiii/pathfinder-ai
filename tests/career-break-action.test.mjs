import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAuthenticatedUserId: vi.fn(),
  findUniqueUser: vi.fn(),
  careerBreakPlanCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/auth-userid", () => ({
  getAuthenticatedUserId: mocks.getAuthenticatedUserId,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    careerBreakPlan: {
      create: mocks.careerBreakPlanCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { planCareerBreak } from "../actions/career-break.js";

describe("planCareerBreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully generates a career break plan", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          handoffPlan: ["Handoff 1"],
          stayingRelevant: ["Learn 1"],
          resumeExplanation: "Took a gap year.",
          linkedinHeadline: "Headline",
          interviewScript: "Gap explanation",
        }),
      },
    });
    mocks.careerBreakPlanCreate.mockResolvedValue({ id: "plan-1" });

    const result = await planCareerBreak("6 months", "Parental leave", "Return to Tech");

    expect(result.success).toBe(true);
    expect(mocks.careerBreakPlanCreate).toHaveBeenCalled();
  });
});
