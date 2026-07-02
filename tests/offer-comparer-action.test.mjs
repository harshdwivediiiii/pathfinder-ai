import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  offerComparisonCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    offerComparison: {
      create: mocks.offerComparisonCreate,
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

import { compareOffers } from "../actions/offer-comparer.js";

describe("compareOffers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully compares offers when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          recommendation: "Accept Offer A.",
          negotiationLeverage: "Leverage Offer B.",
        }),
      },
    });
    mocks.offerComparisonCreate.mockResolvedValue({ id: "comp-1" });

    const offers = [
      { baseSalary: 100000, bonus: 10000, equity: 20000, company: "Company A" },
      { baseSalary: 110000, bonus: 5000, equity: 15000, company: "Company B" }
    ];

    const result = await compareOffers(offers);

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "offerComparer");
    expect(mocks.offerComparisonCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });

    const offers = [
      { baseSalary: 100000, bonus: 10000, equity: 20000, company: "Company A" },
      { baseSalary: 110000, bonus: 5000, equity: 15000, company: "Company B" }
    ];

    const result = await compareOffers(offers);

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("Rate limit exceeded");
    expect(mocks.offerComparisonCreate).not.toHaveBeenCalled();
  });
});
