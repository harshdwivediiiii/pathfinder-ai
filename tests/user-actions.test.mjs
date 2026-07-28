import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  industryInsightFindUnique: vi.fn(),
  industryInsightUpsert: vi.fn(),
  generateAIInsights: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  clerkClient: mocks.clerkClient,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
    industryInsight: {
      findUnique: mocks.industryInsightFindUnique,
      upsert: mocks.industryInsightUpsert,
    },
    $transaction: vi.fn((cb) =>
      cb({
        industryInsight: {
          upsert: mocks.industryInsightUpsert,
          findUnique: mocks.industryInsightFindUnique,
        },
        user: {
          update: mocks.userUpdate,
        },
      })
    ),
  },
}));

vi.mock("../actions/dashboard.js", () => ({
  generateAIInsights: mocks.generateAIInsights,
}));

import { updateUser } from "../actions/user.js";

describe("updateUser action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validProfileData = {
    industry: "Quantum Computing",
    currentRole: "Researcher",
    targetRole: "Lead Researcher",
    careerGoals: "Advance quantum algorithms",
    experience: 5,
    bio: "Passionate about quantum computing",
    skills: ["Qiskit", "Python"],
  };

  it.skip("successfully updates user and creates industry insight when AI generation succeeds", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.userFindUnique.mockResolvedValue({ id: "db-user-1", clerkUserId: "clerk-user-1" });
    mocks.industryInsightFindUnique.mockResolvedValue(null);

    const mockAiInsights = {
      salaryRanges: [],
      growthRate: 15,
      demandLevel: "High",
      topSkills: ["Qiskit"],
      marketOutlook: "Very positive growth ahead.",
      keyTrends: ["Quantum error correction"],
      recommendedSkills: ["Linear algebra"],
    };
    mocks.generateAIInsights.mockResolvedValue(mockAiInsights);

    const mockUpdatedUser = { id: "db-user-1", ...validProfileData };
    mocks.userUpdate.mockResolvedValue(mockUpdatedUser);
    mocks.industryInsightUpsert.mockResolvedValue({
      industry: "Quantum Computing",
      ...mockAiInsights,
    });

    const result = await updateUser(validProfileData);

    expect(mocks.generateAIInsights).toHaveBeenCalledWith("Quantum Computing", expect.any(Object));
    expect(mocks.industryInsightUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { industry: "Quantum Computing" },
        create: expect.objectContaining({
          industry: "Quantum Computing",
          growthRate: 15,
          demandLevel: "High",
          marketOutlook: "Very positive growth ahead.",
        }),
      })
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "db-user-1" },
        data: expect.objectContaining({
          industry: "Quantum Computing",
        }),
      })
    );
    expect(result).toEqual({
      updatedUser: mockUpdatedUser,
      industryInsight: {
        industry: "Quantum Computing",
        ...mockAiInsights,
      },
    });
  });

  it.skip("successfully updates user and creates placeholder industry insight when AI generation fails", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.userFindUnique.mockResolvedValue({ id: "db-user-1", clerkUserId: "clerk-user-1" });
    mocks.industryInsightFindUnique.mockResolvedValue(null);

    // Simulate AI generation failure
    mocks.generateAIInsights.mockRejectedValue(new Error("Gemini API Rate Limit Exceeded"));

    const mockUpdatedUser = { id: "db-user-1", ...validProfileData };
    mocks.userUpdate.mockResolvedValue(mockUpdatedUser);
    mocks.industryInsightUpsert.mockResolvedValue({
      industry: "Quantum Computing",
      salaryRanges: [],
      growthRate: 0,
      demandLevel: "Medium",
      topSkills: [],
      marketOutlook: "AI insights generation failed. This profile will be updated automatically in the future.",
      keyTrends: [],
      recommendedSkills: [],
    });

    const result = await updateUser(validProfileData);

    expect(mocks.generateAIInsights).toHaveBeenCalledWith("Quantum Computing", expect.any(Object));
    expect(mocks.industryInsightUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { industry: "Quantum Computing" },
        create: expect.objectContaining({
          industry: "Quantum Computing",
          growthRate: 0,
          demandLevel: "Medium",
          marketOutlook: "AI insights generation failed. This profile will be updated automatically in the future.",
        }),
      })
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "db-user-1" },
        data: expect.objectContaining({
          industry: "Quantum Computing",
        }),
      })
    );
    expect(result.updatedUser).toEqual(mockUpdatedUser);
    expect(result.industryInsight.growthRate).toBe(0);
    expect(result.industryInsight.demandLevel).toBe("Medium");
  });
});
