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
  decrementRateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: actionMocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: actionMocks.findUnique,
    },
    assessment: {
      create: actionMocks.assessmentCreate,
    },
  },
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: actionMocks.checkRateLimit,
  decrementRateLimit: actionMocks.decrementRateLimit,
  formatResetTime: actionMocks.formatResetTime,
}));

vi.mock("@/lib/cache", () => {
  const store = {
    get: actionMocks.cacheGet,
    delete: actionMocks.cacheDelete,
    set: vi.fn(async () => ({ status: "success", value: true, isSuccess: true, isMiss: false, isError: false })),
  };
  return {
    getCacheStore: () => store,
    generateCacheKey: (...args) => args.join(":"),
    QUIZ_CACHE_TTL_MS: 3600000,
    getCachedOrFetch: async (key, ns, fetcher) => fetcher(),
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
    const store = getCacheStore();
    await store.set(cacheKey, questions);

    const answers = ["Measuring temperature"]; // Wrong answer

    actionMocks.cacheGet.mockResolvedValue({ status: "success", value: questions, isSuccess: true });

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

  it("caches fallback quiz questions so saveQuizResult can load the session", async () => {
    const { generateQuiz, saveQuizResult } = await import("../actions/interview.js");
    const { getCacheStore } = await import("../lib/cache/index.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-123" });
    actionMocks.findUnique.mockResolvedValue({
      id: "db-user-123",
      clerkUserId: "user-123",
      industry: "Healthcare",
    });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: true });

    // Force the fallback path in generateQuiz
    actionMocks.generateGeminiContent.mockRejectedValue(new Error("AI service unavailable"));

    const fallbackResult = await generateQuiz("Technical");
    expect(fallbackResult.isFallback).toBe(true);
    expect(fallbackResult.sessionId).toBeTruthy();

    // The fallback session must be written to the quiz cache
    const store = getCacheStore();
    const quizSessionWrites = store.set.mock.calls.filter(([key]) => key.includes("quiz-session"));
    expect(quizSessionWrites.length).toBe(1);
    expect(quizSessionWrites[0][1]).toEqual(fallbackResult.questions);

    // The cache now returns the persisted fallback questions, so saveQuizResult can load them
    actionMocks.cacheGet.mockResolvedValue({
      status: "success",
      value: fallbackResult.questions,
      isSuccess: true,
      isMiss: false,
      isError: false,
    });
    actionMocks.assessmentCreate.mockImplementation(({ data }) => Promise.resolve({ id: "assessment-1", ...data }));

    const answers = fallbackResult.questions.map((q) => q.correctAnswer);
    const saveResult = await saveQuizResult(fallbackResult.sessionId, answers, "Technical");

    expect(saveResult.quizScore).toBe(100);
    expect(saveResult.userId).toBe("db-user-123");
    expect(actionMocks.assessmentCreate).toHaveBeenCalledTimes(1);
  });
});
