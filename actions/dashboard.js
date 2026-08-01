"use server";
import { handleServerError } from "@/lib/errors/error-handler";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { getCachedOrFetch } from "@/lib/ai/ai-cache";
import { createLookupResponse } from "@/lib/errors/lookup-response";
import {
  generateIndustryInsightData,
  getIndustryInsightRefreshTime,
  isIndustryInsightStale,
} from "@/lib/misc/industry-insights";

export async function getDashboardStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      resumes: true,
      coverLetters: true,
      interviews: true,
    },
  });

  return {
    totalResumes: user?.resumes?.length || 0,
    totalCoverLetters: user?.coverLetters?.length || 0,
    totalInterviews: user?.interviews?.length || 0,
  };
}

/**
 * Generates industry insights using Gemini AI.
 * If AI generation fails, provides high-quality default fallback insights.
 */
export async function generateAIInsights(industry, profile = null) {
  return getCachedOrFetch(
    JSON.stringify({ industry, profile }),
    'insights',
    async () => {
      return generateIndustryInsightData(industry, profile);
    },
    24
  );
}

/**
 * Fetches or creates industry insights for the signed-in user.
 */
export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });
  if (!user) return createLookupResponse(null);;

  if (!user.industry) {
    return null;
  }

  try {
    if (isIndustryInsightStale(user.industryInsight)) {
      const insights = await generateAIInsights(user.industry, user);
      const nextUpdate = getIndustryInsightRefreshTime();

      const industryInsight = await db.industryInsight.upsert({
        where: { industry: user.industry },
        create: {
          industry: user.industry,
          salaryRanges: insights.salaryRanges,
          growthRate: insights.growthRate,
          demandLevel: insights.demandLevel,
          topSkills: insights.topSkills,
          marketOutlook: insights.marketOutlook,
          keyTrends: insights.keyTrends,
          recommendedSkills: insights.recommendedSkills,
          isGrounded: insights.isGrounded,
          lastUpdated: new Date(),
          nextUpdate,
        },
        update: {
          salaryRanges: insights.salaryRanges,
          growthRate: insights.growthRate,
          demandLevel: insights.demandLevel,
          topSkills: insights.topSkills,
          marketOutlook: insights.marketOutlook,
          keyTrends: insights.keyTrends,
          recommendedSkills: insights.recommendedSkills,
          isGrounded: insights.isGrounded,
          lastUpdated: new Date(),
          nextUpdate,
        },
      });

      return industryInsight;
    }

    return user.industryInsight;
  } catch (error) {
    return handleServerError(error, "dashboard");
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) {
    return { isOnboarded: false, user: null, isSignedIn: false };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  return {
    isOnboarded: Boolean(user?.industry),
    user,
    isSignedIn: true,
  };
}
