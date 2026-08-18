"use server";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { getCachedOrFetch } from "@/lib/ai/ai-cache";
import { createLookupResponse } from "@/lib/errors/lookup-response";
import {
  generateIndustryInsightData,
  getIndustryInsightRefreshTime,
  isIndustryInsightStale,
} from "@/lib/misc/industry-insights";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { parseAIJson } from "@/lib/ai/validate";

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

  return {
    totalResumes: user?.resume ? 1 : 0,
    totalCoverLetters: user?.coverLetter?.length || 0,
    totalInterviews: user?.mockInterviewSessions?.length || 0,
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
  if (!user) return createLookupResponse(null);

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
    console.error("Failed to generate industry insights:", error);
    return null;
  }
}

export async function getWeeklySummaryStats() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, currentRole: true, targetRole: true }
  });
  
  if (!user) return null;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [resumes, coverLetters, interviews, ats] = await Promise.all([
    db.resume.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
    db.coverLetter.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
    db.assessment.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
    db.atsAnalysis.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const stats = { resumes, coverLetters, interviews, ats };
  const hasActivity = Object.values(stats).some(val => val > 0);

  let recommendations = null;
  
  if (hasActivity) {
    recommendations = await getCachedOrFetch(
      `weekly-recs-${user.id}-${sevenDaysAgo.toDateString()}`,
      'weekly-recs',
      async () => {
        const prompt = buildSecurePrompt({
          context: "You are a personalized career AI assistant. Review the user's activity for the past 7 days.",
          task: "Generate 2-3 very short, actionable recommendations for what the user should focus on next week based on what they just accomplished.",
          untrustedData: [
            { label: "Activity", value: JSON.stringify(stats), maxLength: 100 },
            { label: "Role", value: user.currentRole || "Professional", maxLength: 50 },
            { label: "Target", value: user.targetRole || "Next level", maxLength: 50 }
          ],
          outputRules: "Return a JSON array of strings, e.g. [\"Update your resume\", \"Practice behavioral interviews\"]."
        });
        
        try {
          const aiResult = await generateGeminiContent(prompt);
          return parseAIJson(aiResult.response.text());
        } catch (e) {
          console.error("Failed to generate weekly recs:", e);
          return ["Keep up the great work!", "Focus on networking and applying to new roles."];
        }
      },
      24 // Cache for 24 hours
    );
  }

  return { stats, recommendations, hasActivity };
}
