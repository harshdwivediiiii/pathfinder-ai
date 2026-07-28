import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  burnoutAssessmentCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

// Mock the db with ALL methods that any tested code path might call
vi.mock("@/lib/db/prisma", async () => {
  const actual = await vi.importActual("@/lib/db/prisma");
  return {
    ...actual,
    db: {
      user: {
        findUnique: mocks.findUniqueUser,
      },
      burnoutAssessment: {
        create: mocks.burnoutAssessmentCreate,
      },
      // Include $queryRaw to avoid TypeError when rate-limit-actions uses it
      $queryRaw: vi.fn(),
    },
  };
});

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/security/rate-limit-actions.js", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { assessBurnout } from "../actions/burnout.js";

describe("assessBurnout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully assesses burnout when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          riskLevel: "High",
          empatheticSummary: "Burnout summary",
          immediateActions: [],
          scripts: [],
        }),
      },
    });
    mocks.burnoutAssessmentCreate.mockResolvedValue({ id: "burnout-1" });

    const result = await assessBurnout("Tiredness", "50 hours a week");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "burnout");
    expect(mocks.burnoutAssessmentCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });

    const result = await assessBurnout("Tiredness", "50 hours a week");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.burnoutAssessmentCreate).not.toHaveBeenCalled();
  });
});
