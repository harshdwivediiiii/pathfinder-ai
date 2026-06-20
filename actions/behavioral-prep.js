"use server";
import { db } from "@/lib/prisma";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth-errors";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateAndParseJson } from "@/lib/ai-generation";
import { generateGeminiContent } from "@/lib/gemini";
import { USER_NOT_FOUND_MESSAGE } from "@/lib/errors";
import { createAiPrompt } from "@/lib/prompt-builder";

export async function generateAssessmentStrategy(company, assessmentType) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  if (!company || !assessmentType) {
    return { success: false, errors: { _form: ["Company and Assessment Type are required."] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    return { success: false, errors: { _form: [USER_NOT_FOUND_MESSAGE] } };
  }

  const prompt = createAiPrompt({
    context: "You are an expert organizational psychologist and executive recruiter.",
    task: `Analyze the '${assessmentType}' personality/behavioral test often used by '${company}'.
    Explain what traits the company is screening for and provide specific strategies on how the candidate should approach the test.`,
    untrustedData: [
      { label: "company", value: company, maxLength: 100 },
      { label: "assessmentType", value: assessmentType, maxLength: 100 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "whatTheyAreTesting": "A paragraph explaining the core psychology behind the test and what the company values.",
  "idealTraits": [
    { "trait": "Trait Name", "description": "Why the company wants this." }
  ],
  "strategies": [
    "A highly specific, actionable tip on how to answer a certain type of question."
  ]
}`,
  });

  try {
    const parsedData = await generateAndParseJson(prompt);
    const record = await db.behavioralPrep.create({
      data: {
        userId: user.id,
        company,
        assessmentType,
        content: parsedData,
      },
    });
    revalidatePath("/behavioral-prep");
    return { success: true, data: record };
  } catch (error) {
    console.error("Behavioral Prep Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate assessment strategy"] } };
  }
}

export async function getBehavioralPreps() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return { success: false, data: [] };

  const records = await db.behavioralPrep.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, data: records };
}