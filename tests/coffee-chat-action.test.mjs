import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  findFirstSession: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
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
    coffeeChatSession: {
      findFirst: mocks.findFirstSession,
      create: mocks.createSession,
      update: mocks.updateSession,
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

import { startCoffeeChat, sendCoffeeChatMessage, generateCoffeeChatFeedback } from "../actions/coffee-chat.js";

describe("coffee chat actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, resetAt: new Date() });
  });

  describe("startCoffeeChat", () => {
    it("successfully creates a coffee chat session", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "user-1" });
      mocks.createSession.mockResolvedValue({ id: "session-1", userId: "user-1" });

      const result = await startCoffeeChat("Tech", "Engineer");
      expect(result.success).toBe(true);
      expect(result.data.id).toBe("session-1");
      expect(mocks.createSession).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          industry: "Tech",
          targetRole: "Engineer",
          chatHistory: [expect.any(Object)],
        },
      });
    });

    it.skip("fails when user is not found in database", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue(null);

      const result = await startCoffeeChat("Tech", "Engineer");
      expect(result.success).toBe(false);
      expect(result.errors._form[0]).toContain("User not found");
      expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    });

    it.skip("fails when industry or targetRole is whitespace-only", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "user-1" });

      const result = await startCoffeeChat("   ", "Engineer");
      expect(result.success).toBe(false);
      expect(result.errors._form[0]).toContain("required");
      expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    });

    it("fails when rate limit is exceeded after validation passes", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "user-1" });
      mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });

      const result = await startCoffeeChat("Tech", "Engineer");
      expect(result.success).toBe(false);
      expect(result.errors._form[0]).toContain("limit reached");
      expect(mocks.createSession).not.toHaveBeenCalled();
    });
  });

  describe("sendCoffeeChatMessage", () => {
    it("fails if session is not found or unauthorized via findFirst", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "user-1" });
      mocks.findFirstSession.mockResolvedValue(null);

      const result = await sendCoffeeChatMessage("session-1", "Hello");
      expect(result.success).toBe(false);
      expect(result.errors._form).toContain("Session not found or unauthorized");
      expect(mocks.findFirstSession).toHaveBeenCalledWith({
        where: { id: "session-1", userId: "user-1" },
      });
    });

    it("successfully sends message and saves reply when session is owned", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "user-1" });
      mocks.findFirstSession.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        industry: "Tech",
        targetRole: "Engineer",
        chatHistory: [],
      });
      mocks.generateGeminiContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({ reply: "Fine advice" }),
        },
      });
      mocks.updateSession.mockResolvedValue({ id: "session-1" });

      const result = await sendCoffeeChatMessage("session-1", "Hello");
      expect(result.success).toBe(true);
      expect(mocks.updateSession).toHaveBeenCalledWith({
        where: { id: "session-1", userId: "user-1" },
        data: {
          chatHistory: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Fine advice" },
          ],
        },
      });
    });
  });

  describe("generateCoffeeChatFeedback", () => {
    it("fails if session is not found or unauthorized via findFirst", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "user-1" });
      mocks.findFirstSession.mockResolvedValue(null);

      const result = await generateCoffeeChatFeedback("session-1");
      expect(result.success).toBe(false);
      expect(result.errors._form).toContain("Session not found or unauthorized");
      expect(mocks.findFirstSession).toHaveBeenCalledWith({
        where: { id: "session-1", userId: "user-1" },
      });
    });
  });
});
