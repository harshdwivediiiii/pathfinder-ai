import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  promotionStrategyCreate: vi.fn(),
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
    promotionStrategy: {
      create: mocks.promotionStrategyCreate,
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

import { generatePromotionStrategy } from "../actions/promotion.js";

describe("generatePromotionStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully generates promotion strategy when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          bragDocument: "Brag",
          negotiationScript: "Script",
          timelineActions: [],
        }),
      },
    });
    mocks.promotionStrategyCreate.mockResolvedValue({ id: "promo-1" });

    const result = await generatePromotionStrategy("Shipped feature X", "Senior Dev");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "promotion");
    expect(mocks.promotionStrategyCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });

    const result = await generatePromotionStrategy("Shipped feature X", "Senior Dev");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.promotionStrategyCreate).not.toHaveBeenCalled();
  });
});
