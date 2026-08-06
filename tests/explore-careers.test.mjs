import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  asBrowseCareers,
  rankExploreCareers,
  scoreCareerAgainstProfile,
} from "../lib/misc/explore-careers.js";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("@/lib/errors/error-handler", () => ({
  handleServerError: vi.fn(),
}));

import { getExploreCareers } from "../actions/explore.js";

const sampleCareers = [
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    matchScore: 92,
    skills: ["React", "JavaScript", "CSS", "Next.js", "TypeScript"],
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    matchScore: 65,
    skills: ["Python", "Machine Learning", "SQL", "Statistics"],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    matchScore: 88,
    skills: ["Agile", "Strategy", "Communication", "Data Analysis"],
  },
];

describe("explore career ranking", () => {
  it("returns browse examples with null match scores when no profile signal exists", () => {
    const result = rankExploreCareers(sampleCareers, null);

    expect(result.every((career) => career.isPersonalized === false)).toBe(true);
    expect(result.every((career) => career.matchScore === null)).toBe(true);
    expect(result[0].matchScore).not.toBe(92);
  });

  it("scores careers from skill overlap instead of hard-coded mock percentages", () => {
    const scored = scoreCareerAgainstProfile(sampleCareers[0], {
      skills: ["React", "JavaScript", "CSS"],
    });

    expect(scored.isPersonalized).toBe(true);
    expect(scored.matchScore).toBe(60);
    expect(scored.matchedSkills).toEqual(["React", "JavaScript", "CSS"]);
    expect(scored.missingSkills).toEqual(["Next.js", "TypeScript"]);
  });

  it("ranks different profiles differently and boosts target role matches", () => {
    const frontendProfile = rankExploreCareers(sampleCareers, {
      skills: ["React", "TypeScript", "Next.js"],
      targetRole: "Frontend Developer",
    });
    const dataProfile = rankExploreCareers(sampleCareers, {
      skills: ["Python", "SQL", "Machine Learning"],
      targetRole: "Data Scientist",
    });

    expect(frontendProfile[0].id).toBe("frontend-developer");
    expect(dataProfile[0].id).toBe("data-scientist");
    expect(frontendProfile[0].matchScore).not.toBe(dataProfile[0].matchScore);
    expect(frontendProfile[0].matchScore).toBeGreaterThan(60);
  });

  it("asBrowseCareers strips fake match percentages", () => {
    const browse = asBrowseCareers(sampleCareers);
    expect(browse).toHaveLength(3);
    expect(browse.every((c) => c.matchScore === null && c.isPersonalized === false)).toBe(
      true
    );
  });
});

describe("getExploreCareers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns browse examples for signed-out visitors", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const result = await getExploreCareers();

    expect(result.every((career) => career.isPersonalized === false)).toBe(true);
    expect(result.every((career) => career.matchScore === null)).toBe(true);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("personalizes and reorders careers for a signed-in profile with skills", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.findUnique.mockResolvedValue({
      skills: ["Python", "SQL", "Statistics"],
      targetRole: "Data Scientist",
    });

    const result = await getExploreCareers();

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { clerkUserId: "clerk-1" },
      select: { skills: true, targetRole: true },
    });
    expect(result[0].isPersonalized).toBe(true);
    expect(result[0].id).toBe("data-scientist");
    expect(typeof result[0].matchScore).toBe("number");
  });

  it("falls back to browse examples when the user has no skills or target role", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-2" });
    mocks.findUnique.mockResolvedValue({
      skills: [],
      targetRole: null,
    });

    const result = await getExploreCareers();

    expect(result.every((career) => career.isPersonalized === false)).toBe(true);
    expect(result.every((career) => career.matchScore === null)).toBe(true);
  });
});
