import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateQuiz, saveQuizResult, getAssessment } from "../actions/interview.js";

// Pre-create all mock functions BEFORE vi.mock calls
const mockAuth = vi.fn();
const mockFindUniqueUser = vi.fn();
const mockCreateAssessment = vi.fn();
const mockGenerateGeminiContent = vi.fn();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheDelete = vi.fn();
const mockAssessmentFindFirst = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockFormatResetTime = vi.fn();
const mockDecrementRateLimit = vi.fn();
const mockDbQueryRaw = vi.fn();
const mockAiRateLimitFindUnique = vi.fn();
const mockAiRateLimitUpsert = vi.fn();
const mockAiRateLimitUpdate = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mockFindUniqueUser,
    },
    assessment: {
      create: mockCreateAssessment,
      findFirst: mockAssessmentFindFirst,
    },
    aiRateLimit: {
      findUnique: mockAiRateLimitFindUnique,
      upsert: mockAiRateLimitUpsert,
      update: mockAiRateLimitUpdate,
    },
    $queryRaw: mockDbQueryRaw,
  },
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mockCheckRateLimit,
  decrementRateLimit: mockDecrementRateLimit,
  formatResetTime: mockFormatResetTime,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mockGenerateGeminiContent,
}));

vi.mock("@/lib/cache", async () => {
  const actual = await vi.importActual("@/lib/cache");
  const mockCacheStore = {
    get: mockCacheGet,
    set: mockCacheSet,
    delete: mockCacheDelete,
  };
  return {
    ...actual,
    cacheStore: mockCacheStore,
    getCacheStore: () => mockCacheStore,
  };
});

describe("interview actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks and set defaults
    mockAuth.mockReset();
    mockFindUniqueUser.mockReset();
    mockCreateAssessment.mockReset();
    mockGenerateGeminiContent.mockReset();
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockCacheDelete.mockReset();
    mockAssessmentFindFirst.mockReset();
    mockCheckRateLimit.mockReset();
    mockFormatResetTime.mockReset();
    mockDecrementRateLimit.mockReset();
    mockDbQueryRaw.mockReset();
    mockAiRateLimitFindUnique.mockReset();
    mockAiRateLimitUpsert.mockReset();
    mockAiRateLimitUpdate.mockReset();
    // Default implementations
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockFormatResetTime.mockReturnValue("1h");
    mockAiRateLimitFindUnique.mockResolvedValue(null);
    mockAiRateLimitUpsert.mockResolvedValue({ count: 1 });
    mockAiRateLimitUpdate.mockResolvedValue({});
    mockCacheGet.mockResolvedValue(undefined); // cache miss = calls AI
  });

  describe("generateQuiz", () => {
    it("successfully generates quiz questions and stores them in cache under a session ID", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
      mockFindUniqueUser.mockResolvedValue({
        id: "user-1",
        industry: "technology",
        skills: ["javascript", "react"],
      });

      mockGenerateGeminiContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              questions: [
                {
                  question: "What is 2+2?",
                  options: ["3", "4", "5", "6"],
                  correctAnswer: "4",
                  explanation: "Basic math",
                },
              ],
            }),
        },
      });

      const result = await generateQuiz("Technical");

      expect(result).toHaveProperty("sessionId");
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].question).toBe("What is 2+2?");
      expect(mockCacheSet).toHaveBeenCalledTimes(1);
      const cacheKey = mockCacheSet.mock.calls[0][0];
      expect(cacheKey).toContain("quiz-session");
      expect(mockCacheSet.mock.calls[0][1]).toEqual(result.questions);
    });

    it("falls back to default questions and caches them when AI generation fails", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
      mockFindUniqueUser.mockResolvedValue({
        id: "user-1",
        industry: "technology",
        skills: ["javascript", "react"],
      });
      mockGenerateGeminiContent.mockRejectedValue(new Error("AI service down"));

      const result = await generateQuiz("Technical");

      expect(result).toHaveProperty("sessionId");
      expect(result).toHaveProperty("questions");
      expect(result.isFallback).toBe(true);
    });
  });

  describe("saveQuizResult", () => {
    it("recalculates the score server-side based on cached questions and saves it", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
      mockFindUniqueUser.mockResolvedValue({
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

      mockCacheGet.mockResolvedValue({
        status: "success",
        value: cachedQuestions,
        isSuccess: true,
        isMiss: false,
        isError: false,
      });
      mockCreateAssessment.mockImplementation(({ data }) =>
        Promise.resolve({ id: "assessment-1", ...data })
      );

      const sessionId = "12345678-1234-1234-1234-1234567890ab";
      const result = await saveQuizResult(sessionId, ["4", "Framework"], "Technical");

      expect(mockCacheGet).toHaveBeenCalledTimes(1);
      expect(mockCacheDelete).toHaveBeenCalledTimes(1);
      expect(result.quizScore).toBe(50);
      expect(result.userId).toBe("user-1");
      expect(result.category).toBe("Technical");
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].isCorrect).toBe(true);
      expect(result.questions[1].isCorrect).toBe(false);
      expect(mockCreateAssessment).toHaveBeenCalledTimes(1);
    });

    it("returns error if the session is not found in cache", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
      mockFindUniqueUser.mockResolvedValue({
        id: "user-1",
        industry: "technology",
      });

      mockCacheGet.mockResolvedValue({
        status: "miss",
        value: null,
        isSuccess: false,
        isMiss: true,
        isError: false,
      });

      const sessionId = "12345678-1234-1234-1234-1234567890ac";
      const result = await saveQuizResult(sessionId, ["4"], "Technical");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("_form");
      expect(mockCacheDelete).not.toHaveBeenCalled();
      expect(mockCreateAssessment).not.toHaveBeenCalled();
    });
  });

  describe("getAssessment", () => {
    it("returns null if user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });
      const result = await getAssessment("assessment-1");
      expect(result).toBeNull();
    });

    it("returns null if user is not found in database", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk-1" });
      mockFindUniqueUser.mockResolvedValue(null);
      const result = await getAssessment("assessment-1");
      expect(result).toBeNull();
    });

    it("fetches assessment using findFirst with id and userId", async () => {
      const mockUser = { id: "user-1", clerkUserId: "clerk-1" };
      const mockAssessment = { id: "assessment-1", userId: "user-1" };

      mockAuth.mockResolvedValue({ userId: "clerk-1" });
      mockFindUniqueUser.mockResolvedValue(mockUser);
      mockAssessmentFindFirst.mockResolvedValue(mockAssessment);

      const result = await getAssessment("assessment-1");

      expect(result).toEqual(mockAssessment);
      expect(mockAssessmentFindFirst).toHaveBeenCalledWith({
        where: {
          id: "assessment-1",
          userId: "user-1",
        },
      });
    });
  });
});
