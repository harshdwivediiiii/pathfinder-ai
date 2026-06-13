"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  generateIndustryInsightData,
  getIndustryInsightRefreshTime,
  isIndustryInsightStale,
} from "@/lib/industry-insights";


/**
 * Generates industry insights using Gemini AI.
 * If AI generation fails, provides high-quality default fallback insights.
 */
export async function generateAIInsights(industry) {
  return generateIndustryInsightData(industry);
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
  if (!user) return null;

  if (!user.industry) {
    return null;
  }

  try {
    if (isIndustryInsightStale(user.industryInsight)) {
      const insights = await generateAIInsights(user.industry);
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
    console.error("Failed to fetch or save industry insights:", error);
    return null;
  }
}