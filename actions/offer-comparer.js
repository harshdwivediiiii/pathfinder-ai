"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { offersComparisonSchema } from "@/lib/schemas/forms";
import { validateInput } from "@/lib/validate";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function compareOffers(offers) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  const rateLimitResult = await checkRateLimit(user.id, "offerComparer");
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      errors: {
        _form: [
          `Rate limit exceeded. Try again in ${formatResetTime(rateLimitResult.resetAt)}.`,
        ],
      },
    };
  }

  // Validate offers with schema
  const validation = validateInput(offersComparisonSchema, offers);
  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  const validatedOffers = validation.data;

  const prompt = buildSecurePrompt({
    context: "You are an expert career strategist and executive compensation negotiator.",
    task: `Analyze the provided job offers. Calculate the true total compensation (ignoring complex tax implications but factoring in base, bonus, and equity).
    Provide a highly strategic recommendation on which offer the candidate should accept, taking into account the financial differences, remote work flexibility, and potential career trajectory.`,
    untrustedData: [
      { label: "offersData", value: JSON.stringify(validatedOffers), maxLength: 5000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "recommendation": "A 2-3 paragraph strategic analysis declaring a clear winner and explaining why.",
  "negotiationLeverage": "A short sentence or two on how they could use the losing offer to negotiate the winning offer higher."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    // Use validated data for calculation
    const processedOffers = validatedOffers.map(o => {
      return {
        ...o,
        totalCompensation: o.baseSalary + o.bonus + o.equity
      };
    });

    const record = await db.offerComparison.create({
      data: {
        userId: user.id,
        offers: processedOffers,
        analysis: parsedData,
      },
    });

    revalidatePath("/offer-comparer");
    return { success: true, data: record };
  } catch (error) {
    console.error("Offer Comparison Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to compare offers"] } };
  }
}

export async function getOfferComparisons() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.offerComparison.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
