import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  createAssessment: vi.fn(),
  assessmentFindFirst: vi.fn(),
  assessmentFindMany: vi.fn(),
  generateGeminiContent: vi.fn(),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/security/rate-limit-actions.js", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    assessment: {
      create: mocks.createAssessment,
      findFirst: mocks.assessmentFindFirst,
      findMany: mocks.assessmentFindMany,
    },
  },
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/cache", async () => {
  const actual = await vi.importActual("@/lib/cache");
  const mockCacheStore = {
    get: mocks.cacheGet,
    set: mocks.cacheSet,
    delete: mocks.cacheDelete,
  };
  return {
    ...actual,
    cacheStore: mockCacheStore,
    getCacheStore: () => mockCacheStore,
  };
});

import * as interviewModule from "../actions/interview.js";
const { generateQuiz, saveQuizResult, getAssessment, getAssessments, getCoachQuestions } = interviewModule;

describe("interview actions module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.formatResetTime.mockReturnValue("1h");
  });

  describe("Regression Tests", () => {
    it("exports clean, single implementations of public action APIs", () => {
      expect(typeof interviewModule.generateQuiz).toBe("function");
      expect(typeof interviewModule.saveQuizResult).toBe("function");
      expect(typeof interviewModule.getAssessment).toBe("function");
      expect(typeof interviewModule.getAssessments).toBe("function");
      expect(typeof interviewModule.getCoachQuestions).toBe("function");
      expect(typeof interviewModule.evaluateVoiceAnswer).toBe("function");
      expect(typeof interviewModule.evaluateVideoAnswer).toBe("function");
    });
  });

  describe("generateQuiz", () => {
    it("successfully generates quiz questions via AI and stores them in cache under a session ID", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.userFindUnique.mockResolvedValue({
        id: "user-1",
        industry: "technology",
        skills: ["javascript", "react"],
      });

      const mockAiResponseText = JSON.stringify({
        questions: [
          {
            question: "What is 2+2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: "4",
            explanation: "Basic math",
          },
        ],
      });

      mocks.generateGeminiContent.mockResolvedValue({
        response: {
          text: () => mockAiResponseText,
        },
      });

      const result = await generateQuiz("Technical");

      expect(result).toHaveProperty("sessionId");
      expect(result.isFallback).toBe(false);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].question).toBe("What is 2+2?");

      expect(mocks.cacheSet).toHaveBeenCalledTimes(1);
      const cacheKey = mocks.cacheSet.mock.calls[0][0];
      expect(cacheKey).toContain("quiz-session");
      expect(mocks.cacheSet.mock.calls[0][1]).toEqual(result.questions);
    });

    it("handles unauthenticated users gracefully", async () => {
      mocks.auth.mockResolvedValue({ userId: null });
      const result = await generateQuiz("Technical");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("_form");
    });

    it("falls back to default questions and caches them when AI generation fails", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.userFindUnique.mockResolvedValue({
        id: "user-1",
        industry: "technology",
        skills: ["javascript", "react"],
      });

      mocks.generateGeminiContent.mockRejectedValue(new Error("AI service down"));

      const result = await generateQuiz("Technical");

      expect(result).toHaveProperty("sessionId");
      expect(result.isFallback).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);
      expect(mocks.cacheSet).toHaveBeenCalledTimes(1);
    });

    it("rejects request when rate limit is exceeded", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: Date.now() + 60000 });

      const result = await generateQuiz("Technical");
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("_form");
    });
  });

  describe("saveQuizResult", () => {
    it("recalculates score server-side based on cached questions and saves assessment", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.userFindUnique.mockResolvedValue({
        id: "user-1",
        industry: "technology",
      });

      const cachedQuestions = [
        {
          question: "What is 2+2?",
          options: ["3", "4", "5", "6"],
          correctAnswer: "4",
          explanation: "Basic math",
        },
        {
          question: "What is React?",
          options: ["Library", "Framework", "OS", "Database"],
          correctAnswer: "Library",
          explanation: "UI Library",
        },
      ];

      mocks.cacheGet.mockResolvedValue({ 
        status: "success", 
        value: cachedQuestions, 
        isSuccess: true, 
        isMiss: false, 
        isError: false 
      });
      mocks.createAssessment.mockImplementation(({ data }) => Promise.resolve({ id: "assessment-1", ...data }));

      const answers = ["4", "Framework"];
      const sessionId = "12345678-1234-1234-1234-1234567890ab";
      const result = await saveQuizResult(sessionId, answers, "Technical");

      expect(mocks.cacheGet).toHaveBeenCalledTimes(1);
      expect(mocks.cacheDelete).toHaveBeenCalledTimes(1);

      expect(result.quizScore).toBe(50);
      expect(result.userId).toBe("user-1");
      expect(result.category).toBe("Technical");
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].isCorrect).toBe(true);
      expect(result.questions[1].isCorrect).toBe(false);

      expect(mocks.createAssessment).toHaveBeenCalledTimes(1);
    });

    it("returns error if session is expired or not found in cache", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.userFindUnique.mockResolvedValue({
        id: "user-1",
        industry: "technology",
      });

      mocks.cacheGet.mockResolvedValue({ 
        status: "miss", 
        value: null, 
        isSuccess: false, 
        isMiss: true, 
        isError: false 
      });

      const sessionId = "12345678-1234-1234-1234-1234567890ac";
      const result = await saveQuizResult(sessionId, ["4"], "Technical");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("_form");
      expect(mocks.cacheDelete).not.toHaveBeenCalled();
      expect(mocks.createAssessment).not.toHaveBeenCalled();
    });

    it("returns validation error for mismatched answer counts", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.userFindUnique.mockResolvedValue({
        id: "user-1",
        industry: "technology",
      });

      const cachedQuestions = [
        { question: "Q1", options: ["A", "B"], correctAnswer: "A", explanation: "" },
        { question: "Q2", options: ["A", "B"], correctAnswer: "B", explanation: "" },
      ];

      mocks.cacheGet.mockResolvedValue(cachedQuestions);

      const sessionId = "12345678-1234-1234-1234-1234567890ad";
      const result = await saveQuizResult(sessionId, ["A"], "Technical"); // only 1 answer for 2 questions

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("_form");
    });
  });

  describe("getAssessment", () => {
    it("returns null if user is not authenticated", async () => {
      mocks.auth.mockResolvedValue({ userId: null });
      const result = await getAssessment("assessment-1");
      expect(result).toBeNull();
      expect(mocks.userFindUnique).not.toHaveBeenCalled();
    });

    it("returns null if user is not found in database", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-1" });
      mocks.userFindUnique.mockResolvedValue(null);
      const result = await getAssessment("assessment-1");
      expect(result).toBeNull();
    });

    it("fetches assessment using findFirst with id and userId", async () => {
      const mockUser = { id: "user-1", clerkUserId: "clerk-1" };
      const mockAssessment = { id: "assessment-1", userId: "user-1" };

      mocks.auth.mockResolvedValue({ userId: "clerk-1" });
      mocks.userFindUnique.mockResolvedValue(mockUser);
      mocks.assessmentFindFirst.mockResolvedValue(mockAssessment);

      const result = await getAssessment("assessment-1");

      expect(result).toEqual(mockAssessment);
      expect(mocks.assessmentFindFirst).toHaveBeenCalledWith({
        where: {
          id: "assessment-1",
          userId: "user-1",
        },
      });
    });
  });
});
