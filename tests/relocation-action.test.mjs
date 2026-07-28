import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  relocationAnalysisCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    relocationAnalysis: {
      create: mocks.relocationAnalysisCreate,
    },
  },
}));

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

import { analyzeRelocation } from "../actions/relocation.js";

describe("analyzeRelocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("returns unauthorized when user is not authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const result = await analyzeRelocation(
      "Bangalore",
      "Mumbai",
      "1000000"
    );

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toBe("Unauthorized");
  });

  it("returns validation error when required inputs are missing", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({
      id: "db-user-1",
    });

    const result = await analyzeRelocation(
      "",
      "Mumbai",
      "1000000"
    );

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("required");
  });

  it("returns error when user is not found", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue(null);

    const result = await analyzeRelocation(
      "Bangalore",
      "Mumbai",
      "1000000"
    );

    expect(result.success).toBe(false);
  });

  it("creates relocation analysis successfully", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });

    mocks.findUniqueUser.mockResolvedValue({
      id: "db-user-1",
    });

    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            costOfLivingDelta: "25% higher",
            equivalentSalary: "1250000",
            hiddenCosts: ["Rent"],
            relocationBonusScript: "Ask politely",
            colaNegotiationScript: "Negotiate COLA",
          }),
      },
    });

    mocks.relocationAnalysisCreate.mockResolvedValue({
      id: "relocation-1",
    });

    const result = await analyzeRelocation(
      "Bangalore",
      "Mumbai",
      "1000000"
    );

    expect(result.success).toBe(true);
    expect(mocks.generateGeminiContent).toHaveBeenCalled();
    expect(mocks.relocationAnalysisCreate).toHaveBeenCalled();
  });

  it("handles AI generation failure gracefully", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });

    mocks.findUniqueUser.mockResolvedValue({
      id: "db-user-1",
    });

    mocks.generateGeminiContent.mockRejectedValue(
      new Error("Gemini failure")
    );

    const result = await analyzeRelocation(
      "Bangalore",
      "Mumbai",
      "1000000"
    );

    expect(result.success).toBe(false);
  });


    
  

  it("successfully analyzes relocation when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          costOfLivingComparison: "Comparison",
          salaryEquivalent: 120000,
          negotiationScripts: [],
          relocationAdvice: "Advice",
        }),
      },
    });
    mocks.relocationAnalysisCreate.mockResolvedValue({ id: "reloc-1" });

    const result = await analyzeRelocation("New York", "San Francisco", "100000");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "relocation");
    expect(mocks.relocationAnalysisCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });

    const result = await analyzeRelocation("New York", "San Francisco", "100000");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.relocationAnalysisCreate).not.toHaveBeenCalled();
  });
});

