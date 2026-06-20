import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  assessmentFindFirst: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    assessment: {
      findFirst: mocks.assessmentFindFirst,
    },
  },
}));

import { getAssessment } from "../actions/interview.js";

describe("getAssessment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
