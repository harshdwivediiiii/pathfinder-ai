"use server";
import { handleServerError } from "@/lib/error-handler";
import { createErrorResponse } from "@/lib/action-errors";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function reframeThoughts(doubts, achievements) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  const limit = await checkRateLimit(userId, "imposterSyndrome");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Imposter syndrome reframing limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  if (!doubts || !achievements) {
    return { success: false, errors: { _form: ["Both fields are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an empathetic Executive Coach trained in Cognitive Behavioral Therapy techniques for high-achievers.",
    task: `Analyze the user's imposter syndrome doubts and cross-reference them with their actual achievements.
    Generate a cognitive reframing exercise that validates their feelings but gently dismantles the imposter syndrome logic using their own factual accomplishments.`,
    untrustedData: [
      { label: "doubts", value: doubts, maxLength: 2000 },
      { label: "achievements", value: achievements, maxLength: 2000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "empathyStatement": "A deeply empathetic, validating 2-sentence opening acknowledging how common and difficult these feelings are.",
  "cognitiveReframes": [
    {
      "theDoubt": "A specific doubt they mentioned",
      "theReality": "The factual reality based on their achievements, reframing the doubt objectively"
    }
  ],
  "powerMantra": "A short, personalized, highly memorable 1-sentence mantra they can repeat when imposter syndrome hits.",
  "actionableAdvice": "One small, specific psychological action they can take today to ground themselves in reality."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.imposterSyndrome.create({
      data: {
        userId: user.id,
        doubts,
        achievements,
        reframeData: parsedData,
      },
    });

    revalidatePath("/imposter-syndrome");
    return { success: true, data: record };
  } catch (error) {
    return handleServerError(error, "imposter-syndrome");
  }
}

export async function getImposterSyndromes() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.imposterSyndrome.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
