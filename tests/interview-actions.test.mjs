import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateQuiz, saveQuizResult, getAssessment } from "../actions/interview.js";

const mocks = vi.hoisted(() => {
  const findUniqueUserMock = vi.fn();
  return {
    auth: vi.fn(),
    findUniqueUser: findUniqueUserMock,
    createAssessment: vi.fn(),
    generateGeminiContent: vi.fn(),
    cacheGet: vi.fn(),
    cacheSet: vi.fn(),
    cacheDelete: vi.fn(),
    userFindUnique: findUniqueUserMock,
    assessmentFindFirst: vi.fn(),
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
    formatResetTime: vi.fn().mockReturnValue("1h"),
    decrementRateLimit: vi.fn(),
    getCachedOrFetch: vi.fn(async (promptKey, feature, fetchFn) => {
      // Call the fetchFn (which internally uses generateGeminiContent mock)
      return fetchFn();
    }),
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: async (args) => {
        const res1 = await mocks.userFindUnique(args);
        if (res1 !== undefined) return res1;
        return mocks.findUniqueUser(args);
      },
    },
    assessment: {
      create: mocks.createAssessment,
      findFirst: mocks.assessmentFindFirst,
    },
    aiResponseCache: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
    aiRateLimit: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  decrementRateLimit: mocks.decrementRateLimit,
  formatResetTime: mocks.formatResetTime,
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

vi.mock("@/lib/ai/ai-cache", () => {
  return {
    getCachedOrFetch: mocks.getCachedOrFetch,
  };
});

describe("interview actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.formatResetTime.mockReturnValue("1h");
    mocks.formatResetTime.mockReturnValue("10m");
  });

  describe("generateQuiz", () => {
    it("successfully generates quiz questions and stores them in cache under a session ID", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({
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
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].question).toBe("What is 2+2?");

      // Verify that questions were cached
      expect(mocks.cacheSet).toHaveBeenCalledTimes(1);
      const cacheKey = mocks.cacheSet.mock.calls[0][0];
      expect(cacheKey).toContain("quiz-session");
      expect(mocks.cacheSet.mock.calls[0][1]).toEqual(result.questions);
    });

    it("falls back to default questions and caches them when AI generation fails", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({
        id: "user-1",
        industry: "technology",
        skills: ["javascript", "react"],
      });

      mocks.generateGeminiContent.mockRejectedValue(new Error("AI service down"));

      const result = await generateQuiz("Technical");

      // When AI fails, it successfully returns fallback questions
      expect(result).toHaveProperty("sessionId");
      expect(result).toHaveProperty("questions");
      expect(result.isFallback).toBe(true);
    });
  });

  describe("saveQuizResult", () => {
    it("recalculates the score server-side based on cached questions and saves it", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({
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

      // Mock cacheGet to return structured result with questions
      mocks.cacheGet.mockResolvedValue({ 
        status: "success", 
        value: cachedQuestions, 
        isSuccess: true, 
        isMiss: false, 
        isError: false 
      });
      mocks.createAssessment.mockImplementation(({ data }) => Promise.resolve({ id: "assessment-1", ...data }));

      // User got 1 correct and 1 wrong
      const answers = ["4", "Framework"];

      const sessionId = "12345678-1234-1234-1234-1234567890ab";
      const result = await saveQuizResult(sessionId, answers, "Technical");

      // Verify session was retrieved and deleted
      expect(mocks.cacheGet).toHaveBeenCalledTimes(1);
      expect(mocks.cacheDelete).toHaveBeenCalledTimes(1);

      // Score should be 50%
      expect(result.quizScore).toBe(50);
      expect(result.userId).toBe("user-1");
      expect(result.category).toBe("Technical");
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].isCorrect).toBe(true);
      expect(result.questions[1].isCorrect).toBe(false);

      expect(mocks.createAssessment).toHaveBeenCalledTimes(1);
    });

    it("returns error if the session is not found in cache", async () => {
      mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
      mocks.findUniqueUser.mockResolvedValue({
        id: "user-1",
        industry: "technology",
      });

      // Mock cacheGet to return structured miss result
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
  });

  describe("getAssessment", () => {
    it("returns null if user is not authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const result = await getAssessment("assessment-1");
    expect(result).toBeNull();
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
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
      // userFindUnique is called to get the user (may be called multiple times due to mock setup)
      expect(mocks.userFindUnique).toHaveBeenCalled();
    });

  });
});
});
