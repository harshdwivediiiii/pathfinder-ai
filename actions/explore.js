"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/prisma";
import { MOCK_CAREERS } from "@/lib/misc/mock-careers";
import { handleServerError } from "@/lib/errors/error-handler";

/**
 * Fetch personalized career recommendations for the signed-in user.
 * If the user has a profile with skills/targetRole, score careers accordingly.
 * Falls back to the default mock list for anonymous users.
 */
export async function getExploreCareers() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return MOCK_CAREERS.map((career) => ({
        ...career,
        personalizedScore: null,
        matchedSkills: [],
        missingSkills: career.skills,
        isPersonalized: false,
      }));
    }

    const user = await db.user.findUnique({
      where: { clerkUserId },
      select: { skills: true, targetRole: true, industry: true, currentRole: true },
    });

    if (!user || (!user.skills?.length && !user.targetRole)) {
      return MOCK_CAREERS.map((career) => ({
        ...career,
        personalizedScore: null,
        matchedSkills: [],
        missingSkills: career.skills,
        isPersonalized: false,
      }));
    }

    const userSkills = new Set(
      (user.skills || [])
        .flat()
        .map((s) => s.toLowerCase().trim())
        .filter(Boolean)
    );

    const scored = MOCK_CAREERS.map((career) => {
      const careerSkills = career.skills.map((s) => s.toLowerCase());
      const matched = careerSkills.filter((cs) => userSkills.has(cs));
      const missing = careerSkills.filter((cs) => !userSkills.has(cs));
      const rawScore = matched.length / Math.max(careerSkills.length, 1);
      const adjustedScore = Math.round(career.matchScore * 0.4 + rawScore * 60);

      return {
        ...career,
        matchScore: Math.min(adjustedScore, 99),
        personalizedScore: adjustedScore,
        matchedSkills: matched,
        missingSkills: missing,
        isPersonalized: true,
      };
    });

    scored.sort((a, b) => b.personalizedScore - a.personalizedScore);
    return scored;
  } catch (error) {
    handleServerError(error, "explore");
    return MOCK_CAREERS.map((career) => ({
      ...career,
      personalizedScore: null,
      matchedSkills: [],
      missingSkills: career.skills,
      isPersonalized: false,
    }));
  }
}
