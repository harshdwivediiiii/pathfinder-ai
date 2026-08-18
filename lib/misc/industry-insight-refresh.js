import {
  generateIndustryInsightData,
  getIndustryInsightRefreshTime,
} from "./industry-insights.js";

/**
 * Maps an AI insight snapshot into the IndustryInsight persistence shape.
 * Shared by the Inngest worker and the manual refresh CLI.
 */
export function buildIndustryInsightFields(insights, now = new Date()) {
  return {
    salaryRanges: insights.salaryRanges,
    growthRate: insights.growthRate,
    demandLevel: insights.demandLevel,
    topSkills: insights.topSkills,
    marketOutlook: insights.marketOutlook,
    keyTrends: insights.keyTrends,
    recommendedSkills: insights.recommendedSkills,
    isGrounded: insights.isGrounded,
    lastUpdated: now,
    nextUpdate: getIndustryInsightRefreshTime(now.getTime()),
  };
}

/**
 * Generate and upsert industry insights through the maintained insight helpers.
 *
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string} industry
 */
export async function refreshIndustryInsight(db, industry) {
  if (!industry || typeof industry !== "string" || !industry.trim()) {
    throw new Error("Industry is required");
  }

  const normalizedIndustry = industry.trim();
  const insights = await generateIndustryInsightData(normalizedIndustry);
  const fields = buildIndustryInsightFields(insights);

  const industryInsight = await db.industryInsight.upsert({
    where: { industry: normalizedIndustry },
    create: { industry: normalizedIndustry, ...fields },
    update: fields,
  });

  return { industry: normalizedIndustry, insights, industryInsight };
}
