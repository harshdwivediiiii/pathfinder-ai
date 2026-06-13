"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateVisaStrategy(visaType, targetRole, concerns) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!visaType || !targetRole) {
    return { success: false, errors: { _form: ["Visa type and target role are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Expert Career Coach specializing in international workers and visa sponsorship strategies (H-1B, F-1 OPT/CPT, O-1, TN, etc.).",
    task: `Analyze the user's visa situation, target role, and concerns.
    Generate a strategic timeline for their application process, a highly professional cover letter clause to explain their visa status, and an email script to ask HR about sponsorship without being disqualified early.`,
    untrustedData: [
      { label: "visaType", value: visaType, maxLength: 500 },
      { label: "targetRole", value: targetRole, maxLength: 500 },
      { label: "concerns", value: concerns || "None", maxLength: 2000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "strategicTimeline": ["Step 1 (e.g. 12 months out)", "Step 2", "Step 3"],
  "coverLetterClause": "A powerful 1-2 sentence paragraph to include in cover letters that frames their international background as an asset while transparently (but non-threateningly) mentioning work authorization.",
  "hrEmailScript": "A tactful email template to ask a recruiter or HR about their company's sponsorship policy.",
  "interviewTalkingPoints": ["Point 1 on how to address 'Do you now or in the future require sponsorship?'", "Point 2"]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.visaStrategy.create({
      data: {
        userId: user.id,
        visaType,
        targetRole,
        concerns: concerns || "",
        strategyData: parsedData,
      },
    });

    revalidatePath("/visa-guide");
    return { success: true, data: record };
  } catch (error) {
    console.error("Visa Strategy Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate strategy"] } };
  }
}

export async function getVisaStrategies() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.visaStrategy.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
