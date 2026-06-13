"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateLayoffStrategy(details) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!details || details.trim().length === 0) {
    return { success: false, errors: { _form: ["Please provide some details about the layoff/severance."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an empathetic, expert HR and career transition coach specializing in layoffs and severance packages.",
    task: `Analyze the following layoff scenario/severance details provided by the user.
    Provide a supportive analysis, decode the severance package (if any details are given), suggest 2-3 things they should negotiate or ask HR about before signing, and create a concrete 30-day bounce-back plan.`,
    untrustedData: [
      { label: "layoffDetails", value: details, maxLength: 2000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "empatheticSummary": "A brief, supportive paragraph validating their situation and decoding the severance offer.",
  "negotiationPoints": [
    "Item 1 to negotiate/ask HR (e.g. extending healthcare, keeping laptop)",
    "Item 2 to negotiate/ask HR"
  ],
  "bounceBackPlan": [
    { "timeframe": "Days 1-3", "action": "Immediate things to do" },
    { "timeframe": "Days 4-10", "action": "Next steps" },
    { "timeframe": "Days 11-30", "action": "Long term recovery" }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.layoffStrategy.create({
      data: {
        userId: user.id,
        details,
        planContent: parsedData,
      },
    });

    revalidatePath("/layoff-strategist");
    return { success: true, data: record };
  } catch (error) {
    console.error("Layoff Strategy Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate strategy"] } };
  }
}

export async function getLayoffStrategies() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.layoffStrategy.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
