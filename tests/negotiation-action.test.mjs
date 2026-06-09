import { describe, expect, it, vi, beforeEach } from "vitest";

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  buildSecurePrompt: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: actionMocks.auth,
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

vi.mock("@/lib/rate-limit-actions", () => ({
  checkRateLimit: actionMocks.checkRateLimit,
  formatResetTime: actionMocks.formatResetTime,
}));

vi.mock("@/lib/prompt-safety", async () => {
  const actual = await vi.importActual("@/lib/prompt-safety");
  return {
    ...actual,
    buildSecurePrompt: actionMocks.buildSecurePrompt,
  };
});

describe("salary negotiation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.auth.mockResolvedValue({ userId: "user-123" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: true });
    actionMocks.buildSecurePrompt.mockImplementation((opts) => opts.task);
  });

  describe("chatSalaryNegotiation", () => {
    it("allows valid history and message, wrapping them securely", async () => {
      const { chatSalaryNegotiation } = await import("../actions/negotiation.js");

      actionMocks.generateGeminiContent.mockResolvedValue({
        response: { text: () => "OK" },
      });

      const history = [{ role: "model", content: "Initial offer is $90k." }];
      const userMessage = "Can we do $100k?";

      const result = await chatSalaryNegotiation(history, userMessage);
      expect(result.success).toBe(true);
      expect(result.response).toBe("OK");
      expect(actionMocks.buildSecurePrompt).toHaveBeenCalled();
    });

    it("rejects invalid role in history", async () => {
      const { chatSalaryNegotiation } = await import("../actions/negotiation.js");

      const history = [{ role: "untrusted-role", content: "Attack" }];
      const result = await chatSalaryNegotiation(history, "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid input parameters.");
      expect(actionMocks.generateGeminiContent).not.toHaveBeenCalled();
    });

    it("rejects empty user message", async () => {
      const { chatSalaryNegotiation } = await import("../actions/negotiation.js");

      const history = [{ role: "model", content: "Initial offer is $90k." }];
      const result = await chatSalaryNegotiation(history, "");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid input parameters.");
    });
  });

  describe("evaluateNegotiation", () => {
    it("evaluates valid history", async () => {
      const { evaluateNegotiation } = await import("../actions/negotiation.js");

      const mockResponse = {
        score: 80,
        strengths: ["Polite"],
        weaknesses: ["None"],
        overallFeedback: "Good job",
      };
      actionMocks.generateGeminiContent.mockResolvedValue({
        response: { text: () => JSON.stringify(mockResponse) },
      });

      const history = [
        { role: "model", content: "Initial offer is $90k." },
        { role: "user", content: "How about $100k?" },
      ];

      const result = await evaluateNegotiation(history);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(actionMocks.buildSecurePrompt).toHaveBeenCalled();
    });

    it("rejects empty history", async () => {
      const { evaluateNegotiation } = await import("../actions/negotiation.js");

      const result = await evaluateNegotiation([]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid input parameters.");
    });
  });
});
