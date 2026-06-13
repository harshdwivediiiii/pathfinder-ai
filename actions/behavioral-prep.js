"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateAssessmentStrategy(company, assessmentType) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  if (!company || !assessmentType) {
    return { success: false, errors: { _form: ["Company and Assessment Type are required."] } };
  }

  const prompt = buildSecurePrompt({
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
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.behavioralPrep.create({
      data: {
        userId,
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

  const records = await db.behavioralPrep.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
