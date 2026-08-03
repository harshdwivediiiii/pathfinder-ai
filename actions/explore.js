"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/prisma";
import { MOCK_CAREERS } from "@/lib/misc/mock-careers";
import { handleServerError } from "@/lib/errors/error-handler";

export async function getExploreCareers() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return MOCK_CAREERS.map((c) => ({ ...c, personalizedScore: null, matchedSkills: [], missingSkills: c.skills, isPersonalized: false }));
    }
    const user = await db.user.findUnique({
      where: { clerkUserId },
      select: { skills: true, targetRole: true },
    });
    if (!user || (!user.skills?.length && !user.targetRole)) {
      return MOCK_CAREERS.map((c) => ({ ...c, personalizedScore: null, matchedSkills: [], missingSkills: c.skills, isPersonalized: false }));
    }
    const userSkills = new Set((user.skills || []).flat().map((s) => s.toLowerCase().trim()).filter(Boolean));
    const scored = MOCK_CAREERS.map((career) => {
      const cs = career.skills.map((s) => s.toLowerCase());
      const matched = cs.filter((c) => userSkills.has(c));
      const missing = cs.filter((c) => !userSkills.has(c));
      const adjustedScore = Math.round(career.matchScore * 0.4 + (matched.length / Math.max(cs.length, 1)) * 60);
      return { ...career, matchScore: Math.min(adjustedScore, 99), personalizedScore: adjustedScore, matchedSkills: matched, missingSkills: missing, isPersonalized: true };
    });
    scored.sort((a, b) => b.personalizedScore - a.personalizedScore);
    return scored;
  } catch (error) {
    handleServerError(error, "explore");
    return MOCK_CAREERS.map((c) => ({ ...c, personalizedScore: null, matchedSkills: [], missingSkills: c.skills, isPersonalized: false }));
  }
}
