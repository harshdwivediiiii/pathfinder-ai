import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  mentorOutreachCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/auth-user", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    mentorOutreach: {
      create: mocks.mentorOutreachCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { generateMentorPlan } from "../actions/mentor.js";

describe("generateMentorPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully generates mentor plan", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
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
    expect(mocks.mentorOutreachCreate).toHaveBeenCalled();
  });
});
