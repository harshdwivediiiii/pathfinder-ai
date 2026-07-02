import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  freelanceRateCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/auth-user", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    freelanceRate: {
      create: mocks.freelanceRateCreate,
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

import { calculateRate } from "../actions/freelance-rate.js";

describe("calculateRate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully calculates rate when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "db-user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          calculatedHourlyRate: "$100",
          rateJustification: "Justification",
          projectPricingAdvice: "Advice",
          pushbackScripts: [],
        }),
      },
    });
    mocks.freelanceRateCreate.mockResolvedValue({ id: "rate-1" });

    const result = await calculateRate("React, Node", "5 years", "$100k");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "freelanceRate");
    expect(mocks.freelanceRateCreate).toHaveBeenCalled();
  });

  it("fails to calculate rate when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });

    const result = await calculateRate("React, Node", "5 years", "$100k");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("Freelance rate calculation limit reached");
    expect(mocks.getAuthenticatedUser).not.toHaveBeenCalled();
    expect(mocks.freelanceRateCreate).not.toHaveBeenCalled();
  });
});
