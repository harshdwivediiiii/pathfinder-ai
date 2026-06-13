"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";

export async function generatePromotionStrategy(achievements, targetRole) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  if (!achievements || !targetRole) {
    return { success: false, errors: { _form: ["Achievements and Target Role are required."] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

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
    console.error("Promotion Strategy Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate promotion strategy"] } };
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
