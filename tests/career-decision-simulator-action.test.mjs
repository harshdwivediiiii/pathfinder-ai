import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  careerDecisionSimulationCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  revalidatePath: vi.fn(),
  getUserHistory: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    careerDecisionSimulation: {
      create: mocks.careerDecisionSimulationCreate,
    },
  },
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/history/history-query", () => ({
  getUserHistory: mocks.getUserHistory,
}));

import { simulateCareerDecision, getCareerDecisionSimulations } from "../actions/career-decision-simulator.js";
import { getUserHistory } from "@/lib/history/history-query";

describe("simulateCareerDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully generates simulation when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    
    const mockAIResponse = {
      optionsAnalysis: [
        {
          option: "Option A",
          pros: ["Good pay"],
          cons: ["High stress"],
          riskLevel: "Medium",
          shortTermImpact: "Hard work",
          longTermImpact: "Great experience",
          skillsRequired: ["Resilience"]
        },
        {
          option: "Option B",
          pros: ["Low stress"],
          cons: ["Lower pay"],
          riskLevel: "Low",
          shortTermImpact: "Easy transition",
          longTermImpact: "Slower growth",
          skillsRequired: []
        }
      ],
      recommendedOption: "Option A",
      reasoning: "Because of growth.",
      nextStep: "Accept the offer.",
      confidenceScore: 90
    };

    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockAIResponse),
      },
    });
    
    mocks.careerDecisionSimulationCreate.mockResolvedValue({ id: "sim-1" });

    const input = {
      question: "Should I take Option A or Option B?",
      options: ["Option A", "Option B"]
    };

    const result = await simulateCareerDecision(input);

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "careerDecisionSimulator");
    expect(mocks.careerDecisionSimulationCreate).toHaveBeenCalled();
    expect(mocks.careerDecisionSimulationCreate.mock.calls[0][0].data.analysis).toEqual(mockAIResponse);
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });

    const input = {
      question: "Should I take Option A or Option B?",
      options: ["Option A", "Option B"]
    };

    const result = await simulateCareerDecision(input);

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("Rate limit exceeded");
    expect(mocks.careerDecisionSimulationCreate).not.toHaveBeenCalled();
  });

  it("fails when unauthorized", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const input = {
      question: "Should I take Option A or Option B?",
      options: ["Option A", "Option B"]
    };

    const result = await simulateCareerDecision(input);

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("Unauthorized");
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.careerDecisionSimulationCreate).not.toHaveBeenCalled();
  });

  it("fails validation if less than 2 options provided", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });

    const input = {
      question: "Should I take Option A?",
      options: ["Option A"] // Only 1 option
    };

    const result = await simulateCareerDecision(input);

    expect(result.success).toBe(false);
    expect(result.errors.options).toBeDefined();
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
    expect(mocks.careerDecisionSimulationCreate).not.toHaveBeenCalled();
  });

  it("fails when user is not found in database", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue(null);

    const input = {
      question: "Should I take Option A or Option B?",
      options: ["Option A", "Option B"]
    };

    const result = await simulateCareerDecision(input);

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("User not found");
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("handles AI generation failure gracefully", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    
    mocks.generateGeminiContent.mockRejectedValue(new Error("AI failed"));

    const input = {
      question: "Should I take Option A or Option B?",
      options: ["Option A", "Option B"]
    };

    const result = await simulateCareerDecision(input);

    expect(result.success).toBe(false);
    expect(result.errors._form).toBeDefined();
    expect(mocks.careerDecisionSimulationCreate).not.toHaveBeenCalled();
  });

  it("handles malformed AI output gracefully", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    
    const mockAIResponse = {
      optionsAnalysis: [
        {
          option: "Option A",
          pros: ["Good pay"],
          cons: ["High stress"],
          riskLevel: "Medium",
          shortTermImpact: "Hard work",
          longTermImpact: "Great experience",
          skillsRequired: ["Resilience"]
        }
      ],
      recommendedOption: "Option A",
      reasoning: "Because of growth.",
      nextStep: "Accept the offer.",
      confidenceScore: 90
    };

    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockAIResponse),
      },
    });

    const input = {
      question: "Should I take Option A or Option B?",
      options: ["Option A", "Option B"]
    };

    const result = await simulateCareerDecision(input);

    expect(result.success).toBe(false);
    expect(result.errors._form).toBeDefined();
    expect(mocks.careerDecisionSimulationCreate).not.toHaveBeenCalled();
  });

  it("handles database creation failure gracefully", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    
    const mockAIResponse = {
      optionsAnalysis: [
        {
          option: "Option A",
          pros: ["Good pay"],
          cons: ["High stress"],
          riskLevel: "Medium",
          shortTermImpact: "Hard work",
          longTermImpact: "Great experience",
          skillsRequired: ["Resilience"]
        },
        {
          option: "Option B",
          pros: ["Low stress"],
          cons: ["Lower pay"],
          riskLevel: "Low",
          shortTermImpact: "Easy transition",
          longTermImpact: "Slower growth",
          skillsRequired: []
        }
      ],
      recommendedOption: "Option A",
      reasoning: "Because of growth.",
      nextStep: "Accept the offer.",
      confidenceScore: 90
    };

    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockAIResponse),
      },
    });
    
    mocks.careerDecisionSimulationCreate.mockRejectedValue(new Error("DB failed"));

    const input = {
      question: "Should I take Option A or Option B?",
      options: ["Option A", "Option B"]
    };

    const result = await simulateCareerDecision(input);

    expect(result.success).toBe(false);
    expect(result.errors._form).toBeDefined();
    expect(mocks.careerDecisionSimulationCreate).toHaveBeenCalled();
  });
});

describe("getCareerDecisionSimulations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully retrieves user history", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    
    const mockRecords = [{ id: "sim-1" }, { id: "sim-2" }];
    mocks.getUserHistory.mockResolvedValue(mockRecords);

    const result = await getCareerDecisionSimulations();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockRecords);
    expect(mocks.getUserHistory).toHaveBeenCalled();
  });

  it("returns empty array when unauthorized", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const result = await getCareerDecisionSimulations();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(mocks.getUserHistory).not.toHaveBeenCalled();
  });

  it("returns empty array when user is not found", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue(null);

    const result = await getCareerDecisionSimulations();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(mocks.getUserHistory).not.toHaveBeenCalled();
  });
});
