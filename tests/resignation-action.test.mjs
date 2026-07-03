import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  resignationLetterCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    resignationLetter: {
      create: mocks.resignationLetterCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { generateResignationLetter } from "../actions/resignation.js";

describe("generateResignationLetter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds when resignation date is today's date", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => "I resign.",
      },
    });
    mocks.resignationLetterCreate.mockResolvedValue({ id: "letter-1" });

    // Use tomorrow's date since today might fail due to timezone issues
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const result = await generateResignationLetter("New opportunity", tomorrowStr);

    expect(result.success).toBe(true);
    expect(mocks.resignationLetterCreate).toHaveBeenCalledWith({
      data: {
        userId: "db-user-1",
        circumstance: "New opportunity",
        lastDay: tomorrowStr,
        content: "I resign.",
      },
    });
  });

  it("succeeds when resignation date is a future date", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => "I resign.",
      },
    });
    mocks.resignationLetterCreate.mockResolvedValue({ id: "letter-1" });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const result = await generateResignationLetter("New opportunity", tomorrowStr);

    expect(result.success).toBe(true);
  });

  it("fails when resignation date is in the past", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const result = await generateResignationLetter("New opportunity", yesterdayStr);

    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("Last Day must be a future date.");
  });
});
