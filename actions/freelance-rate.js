"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedUser } from "@/lib/auth/auth-user";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";

export async function calculateRate(skills, experience, targetIncome) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const limit = await checkRateLimit(userId, "freelanceRate");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Freelance rate calculation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const user = await getAuthenticatedUser(userId);
  if (!user) return createErrorResponse("User not found");

  if (!skills || !experience || !targetIncome) {
    return { success: false, errors: { _form: ["Skills, experience, and target income are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Expert Freelance Business Consultant and Pricing Strategist.",
    task: `Analyze the user's skills, experience level, and annual target income.
    Calculate a realistic, competitive hourly rate and a project-based pricing structure for them. Then, generate scripts they can use to justify this rate to potential clients who push back on pricing.`,
    untrustedData: [
      { label: "skills", value: skills, maxLength: 500 },
      { label: "experience", value: experience, maxLength: 500 },
      { label: "targetIncome", value: targetIncome, maxLength: 100 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "calculatedHourlyRate": "The exact recommended hourly rate range (e.g., '$75 - $100/hr')",
  "rateJustification": "A bulleted breakdown of why this rate makes sense based on their skills, overhead, and market value.",
  "projectPricingAdvice": "Advice on how to package their skills into a fixed-price project instead of hourly.",
  "pushbackScripts": [
    { "objection": "That's too expensive.", "script": "Your response" },
    { "objection": "We can find someone cheaper on Upwork.", "script": "Your response" }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.freelanceRate.create({
      data: {
        userId: user.id,
        skills,
        experience,
        targetIncome,
        rateData: parsedData,
      },
    });

    revalidatePath("/freelance-rate");
    return { success: true, data: record };
  } catch (error) {
    await decrementRateLimit(userId, "freelanceRate");
    return handleServerError(error, "freelance-rate");
  }
}

export async function getFreelanceRates() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await getAuthenticatedUser(userId);
  if (!user) return { success: false, data: [] };

  const records = await db.freelanceRate.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
