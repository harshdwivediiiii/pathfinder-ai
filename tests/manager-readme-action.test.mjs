import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getHistoryUser: vi.fn(),
  managerReadmeCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/history-user", () => ({
  getHistoryUser: mocks.getHistoryUser,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    managerReadme: {
      create: mocks.managerReadmeCreate,
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

import { buildReadme } from "../actions/manager-readme.js";

describe("buildReadme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully generates README when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.getHistoryUser.mockResolvedValue({ id: "db-user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          readmeMarkdown: "# Working with Me",
        }),
      },
    });
    mocks.managerReadmeCreate.mockResolvedValue({ id: "readme-1" });

    const result = await buildReadme("Collab style", "No weekends", "Slack only");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "managerReadme");
    expect(mocks.managerReadmeCreate).toHaveBeenCalled();
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.getHistoryUser.mockResolvedValue({ id: "db-user-1" });

    const result = await buildReadme("Collab style", "No weekends", "Slack only");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
    expect(mocks.managerReadmeCreate).not.toHaveBeenCalled();
  });
});
