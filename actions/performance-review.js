"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateSelfAssessment(achievements, challenges, goals) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!achievements || !goals) {
    return { success: false, errors: { _form: ["Achievements and goals are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Expert HR Business Partner and Executive Coach.",
    task: `Analyze the user's raw input regarding their achievements, challenges faced, and goals for the next cycle.
    Draft a highly professional, compelling, metrics-driven self-assessment that they can use for their annual performance review.
    The tone should be confident but not arrogant, framing challenges as growth opportunities.`,
    untrustedData: [
      { label: "achievements", value: achievements, maxLength: 2000 },
      { label: "challenges", value: challenges || "None noted", maxLength: 1000 },
      { label: "goals", value: goals, maxLength: 1000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "executiveSummary": "A powerful 2-3 sentence opening summary of their impact this cycle.",
  "keyAchievements": [
    {
      "title": "Achievement Title",
      "impact": "A bullet point detailing the business impact, framed professionally using the STAR method."
    }
  ],
  "growthAndChallenges": "A paragraph framing their challenges positively, highlighting resilience and learnings.",
  "futureGoals": "A paragraph outlining their strategic goals for the next cycle, showing alignment with company success.",
  "managerTalkingPoints": ["Point 1 to emphasize in the 1-on-1 meeting", "Point 2 to emphasize"]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.performanceReview.create({
      data: {
        userId: user.id,
        achievements,
        challenges: challenges || "",
        goals,
        reviewData: parsedData,
      },
    });

    revalidatePath("/performance-review");
    return { success: true, data: record };
  } catch (error) {
    console.error("Performance Review Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate review"] } };
  }
}

export async function getPerformanceReviews() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.performanceReview.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
