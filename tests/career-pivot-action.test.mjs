import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAuthenticatedUserId: vi.fn(),
  findUniqueUser: vi.fn(),
  careerPivotCreate: vi.fn(),
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
    careerPivot: {
      create: mocks.careerPivotCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { generatePivotStrategy } from "../actions/career-pivot.js";

describe("generatePivotStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully generates a career pivot plan", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          transferableSkills: ["Skill 1"],
          skillGaps: ["Gap 1"],
          roadmap: [{ step: "Phase 1", action: "Action 1" }],
        }),
      },
    });
    mocks.careerPivotCreate.mockResolvedValue({ id: "pivot-1" });

    const result = await generatePivotStrategy("QA Engineer", "Software Engineer");

    expect(result.success).toBe(true);
    expect(mocks.careerPivotCreate).toHaveBeenCalled();
  });
});
