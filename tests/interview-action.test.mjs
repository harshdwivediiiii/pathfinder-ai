import { describe, expect, it, vi, beforeEach } from "vitest";

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  assessmentCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  cacheGet: vi.fn(),
  cacheDelete: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: actionMocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: actionMocks.findUnique,
    },
    assessment: {
      create: actionMocks.assessmentCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

vi.mock("@/lib/rate-limit-actions", () => ({
  checkRateLimit: actionMocks.checkRateLimit,
  formatResetTime: actionMocks.formatResetTime,
}));

vi.mock("@/lib/cache", async () => {
  const actual = await vi.importActual("@/lib/cache");
  return {
    ...actual,
    cacheStore: {
      get: actionMocks.cacheGet,
      delete: actionMocks.cacheDelete,
    },
  };
});

describe("saveQuizResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves quiz result with dynamic industry-aware fallback tip when AI fails", async () => {
    const { saveQuizResult } = await import("../actions/interview.js");
    const { getCacheStore, generateCacheKey } = await import("../lib/cache/index.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-123" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: true });
    actionMocks.findUnique.mockResolvedValue({
      id: "db-user-123",
      clerkUserId: "user-123",
      industry: "Healthcare",
    });

    // Make Gemini API call fail to trigger catch block fallback tip
    actionMocks.generateGeminiContent.mockRejectedValue(new Error("AI service unavailable"));

    actionMocks.assessmentCreate.mockImplementation(({ data }) => Promise.resolve({
      id: "assessment-1",
      ...data,
    }));

    const sessionId = "12345678-1234-1234-1234-1234567890ab";
    const questions = [
      {
        question: "What is a stethoscope used for?",
        options: ["Listening to body sounds", "Measuring temperature", "Testing reflexes", "Checking vision"],
        correctAnswer: "Listening to body sounds",
        explanation: "Stethoscopes detect internal body sounds.",
      },
    ];

    const cacheKey = generateCacheKey("quiz-session", "user-123", sessionId);
    const cacheStore = getCacheStore();
    await cacheStore.set(cacheKey, questions);

    const answers = ["Measuring temperature"]; // Wrong answer

    actionMocks.cacheGet.mockResolvedValue(questions);

    const result = await saveQuizResult(sessionId, answers, "Technical");

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.checkRateLimit).toHaveBeenCalledWith("user-123", "quizFeedback");
    expect(actionMocks.findUnique).toHaveBeenCalled();
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.assessmentCreate).toHaveBeenCalled();

    expect(result.improvementTip).toBe(
      "Focus on reviewing core technical concepts and typical industry practices in healthcare to strengthen your skills."
    );
  });
});
