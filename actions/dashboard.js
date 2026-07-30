"use server";
import { handleServerError } from "@/lib/errors/error-handler";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { createLookupResponse } from "@/lib/errors/lookup-response";
import {
  generateIndustryInsightData,
  getIndustryInsightRefreshTime,
  isIndustryInsightStale,
} from "@/lib/misc/industry-insights";

import { logActivity } from "@/lib/activity"; 

export async function getDashboardStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      resume: true,
      coverLetter: true,
      mockInterviewSessions: true,
    },
  });

  const activity = user ? await getActivityStats(user.id) : { streak: 0, weeklyCount: 0 };

  return {
    totalResumes: user?.resume ? 1 : 0,
    totalCoverLetters: user?.coverLetter?.length || 0,
    totalInterviews: user?.mockInterviewSessions?.length || 0,
    ...activity,
  };
}

export async function getActivityStreak() {
  const { userId } = await auth();
  if (!userId) return { streak: 0, weeklyCount: 0 };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!user) return { streak: 0, weeklyCount: 0 };

  return getActivityStats(user.id);
}

async function getActivityStats(userId) {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const logs = await db.activityLog.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const activeDays = new Set(logs.map((l) => l.createdAt.toISOString().slice(0, 10)));

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!activeDays.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyCount = logs.filter((l) => l.createdAt >= weekAgo).length;

  return { streak, weeklyCount };
}

/**
 * Generates industry insights using Gemini AI.
 * If AI generation fails, provides high-quality default fallback insights.
 */
export async function generateAIInsights(industry, profile = null) {
  return generateIndustryInsightData(industry, profile);
}

/**
 * Fetches or creates industry insights for the signed-in user.
 */
export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createLookupResponse(null);;

  if (!user.industry) {
    return null;
  }

  try {
    const industryInsight = await db.industryInsight.findUnique({
      where: { userId_industry: { userId: user.id, industry: user.industry } },
    });

    if (isIndustryInsightStale(industryInsight)) {
      const insights = await generateAIInsights(user.industry, user);
      const nextUpdate = getIndustryInsightRefreshTime();

      const updated = await db.industryInsight.upsert({
        where: { userId_industry: { userId: user.id, industry: user.industry } },
        create: {
          userId: user.id,
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

      return updated;
    }

    return industryInsight;
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
