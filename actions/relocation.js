"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function analyzeRelocation(currentCity, targetCity, salary) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!currentCity || !targetCity || !salary) {
    return { success: false, errors: { _form: ["Current city, target city, and salary are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Expert Compensation Analyst and Relocation Consultant.",
    task: `Analyze the user's potential relocation from their current city to the target city, along with the offered salary.
    Estimate the cost of living difference, calculate a rough 'equivalent' salary, and provide negotiation scripts to ask for a relocation bonus and a Cost of Living Adjustment (COLA).`,
    untrustedData: [
      { label: "currentCity", value: currentCity, maxLength: 200 },
      { label: "targetCity", value: targetCity, maxLength: 200 },
      { label: "salary", value: salary, maxLength: 100 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "costOfLivingDelta": "A short summary (e.g., 'Target city is approximately 25% more expensive')",
  "equivalentSalary": "The rough estimated salary needed in the target city to maintain their standard of living",
  "hiddenCosts": ["Rent deposit differences", "Transportation/car necessity", "State income tax differences"],
  "relocationBonusScript": "A tactful script to ask for a lump sum relocation bonus or covered moving expenses.",
  "colaNegotiationScript": "A script to negotiate the base salary higher based purely on the cost of living data."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.relocationAnalysis.create({
      data: {
        userId: user.id,
        currentCity,
        targetCity,
        salary,
        analysisData: parsedData,
      },
    });

    revalidatePath("/relocation");
    return { success: true, data: record };
  } catch (error) {
    console.error("Relocation Analysis Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to analyze relocation"] } };
  }
}

export async function getRelocationAnalyses() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.relocationAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
