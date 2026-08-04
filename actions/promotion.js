"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { buildUserProfileContext } from "@/lib/ai/ai-context";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";

export async function generatePromotionStrategy(achievements, targetRole) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  if (!achievements || !targetRole) {
    return { success: false, errors: { _form: ["Achievements and Target Role are required."] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  const limit = await checkRateLimit(userId, "promotion");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Promotion strategy generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user) + "\nYou are an expert executive coach specializing in internal promotions and salary negotiation.",
    task: `Generate a structured 'Brag Document' and a negotiation script for a candidate trying to get promoted to '${targetRole}'.
    Analyze their achievements to calculate their implied ROI to the company. Provide a verbatim script they can use in a 1-on-1 with their manager.`,
    untrustedData: [
      { label: "achievements", value: achievements, maxLength: 2000 },
      { label: "targetRole", value: targetRole, maxLength: 100 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "roiAnalysis": "A 2-3 sentence summary of the massive value the user brings to the company based on their achievements.",
  "bragDocument": [
    { "theme": "Theme (e.g. Leadership)", "points": ["Point 1", "Point 2"] }
  ],
  "script": [
    "Manager: Hey, what's on the agenda for today?",
    "You: [A powerful opening statement about career trajectory...]",
    "Manager: [Typical objection or response...]",
    "You: [Counter-argument using data from the brag document...]"
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.promotionStrategy.create({
      data: {
        userId: user.id,
        targetRole,
        content: parsedData,
      },
    });

    revalidatePath("/promotion-negotiator");
    return { success: true, data: record };
  } catch (error) {
    await decrementRateLimit(userId, "promotion");
    return handleServerError(error, "promotion");
  }
}

export async function getPromotionStrategies() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.promotionStrategy.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
