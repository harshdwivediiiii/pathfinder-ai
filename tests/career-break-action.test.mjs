import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  careerBreakPlanCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
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
      careerBreakPlan: {
        create: mocks.careerBreakPlanCreate,
      },
    },
  };
});

vi.mock("@/lib/ai/gemini", () => ({
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
    mocks.auth.mockResolvedValue({ userId: "user-1" });
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
