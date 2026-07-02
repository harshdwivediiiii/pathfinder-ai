import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  behavioralPrepCreate: vi.fn(),
  generateAndParseJson: vi.fn(),
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
    behavioralPrep: {
      create: mocks.behavioralPrepCreate,
    },
  },
}));

vi.mock("@/lib/ai-generation", () => ({
  generateAndParseJson: mocks.generateAndParseJson,
}));

vi.mock("@/lib/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { generateAssessmentStrategy } from "../actions/behavioral-prep.js";

describe("generateAssessmentStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully generates strategy when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateAndParseJson.mockResolvedValue({
      whatTheyAreTesting: "Testing",
      idealTraits: [],
      strategies: [],
    });
    mocks.behavioralPrepCreate.mockResolvedValue({ id: "prep-1" });

    const result = await generateAssessmentStrategy("Google", "GCA");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "behavioralPrep");
    expect(mocks.behavioralPrepCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });

    const result = await generateAssessmentStrategy("Google", "GCA");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.behavioralPrepCreate).not.toHaveBeenCalled();
  });
});
