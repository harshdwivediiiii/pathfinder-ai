"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
function createSideHustleValidationResponse(message) {
  return {
    success: false,
    errors: {
      _form: [message],
    },
  };
}
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";

export async function generateSideHustles(skills, interests) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const limit = await checkRateLimit(userId, "sideHustle");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Side hustle ideas limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  if (!skills || !interests) {
    return createSideHustleValidationResponse(
  "Both skills and interests are required."
);
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert Solopreneur and Micro-SaaS consultant.",
    task: `Analyze the user's skills and interests.
    Generate 3 highly specific, actionable side hustle or micro-business ideas that they could start this weekend with minimal capital. Avoid generic ideas like 'start a blog' or 'dropshipping'. Be very specific to their skills.`,
    untrustedData: [
      { label: "skills", value: skills, maxLength: 2000 },
      { label: "interests", value: interests, maxLength: 2000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "ideas": [
    {
      "name": "Catchy Name for Idea 1",
      "description": "What it is and why their skills make them perfect for it.",
      "targetAudience": "Who exactly will pay for this.",
      "pricingStrategy": "How to price it (e.g. $500/mo retainer, $49 one-off).",
      "firstStep": "The literal first thing they should do today."
    },
    {
      "name": "Catchy Name for Idea 2",
      "description": "...",
      "targetAudience": "...",
      "pricingStrategy": "...",
      "firstStep": "..."
    },
    {
      "name": "Catchy Name for Idea 3",
      "description": "...",
      "targetAudience": "...",
      "pricingStrategy": "...",
      "firstStep": "..."
    }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.sideHustleIdea.create({
      data: {
        userId: user.id,
        skills,
        interests,
        ideasData: parsedData,
      },
    });

    revalidatePath("/side-hustle");
    return { success: true, data: record };
  } catch (error) {
    await decrementRateLimit(userId, "sideHustle");
    return handleServerError(error, "side-hustle");
  }
}

export async function getSideHustleIdeas() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.sideHustleIdea.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
