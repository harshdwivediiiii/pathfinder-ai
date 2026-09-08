import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  mentorOutreachCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/auth/auth-user", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    mentorOutreach: {
      create: mocks.mentorOutreachCreate,
    },
  },
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { generateMentorPlan } from "../actions/mentor.js";

describe("generateMentorPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully generates mentor plan when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "db-user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          mentorArchetype: "Archetype details",
          whereToFindThem: ["LinkedIn"],
          outreachMessage: "Cold message",
          sixMonthAgenda: [],
        }),
      },
    });
    mocks.mentorOutreachCreate.mockResolvedValue({ id: "outreach-1" });

    const result = await generateMentorPlan("Get a job", "Tech");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "mentor");
    expect(mocks.mentorOutreachCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "db-user-1" });

    const result = await generateMentorPlan("Get a job", "Tech");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.mentorOutreachCreate).not.toHaveBeenCalled();
  });
});