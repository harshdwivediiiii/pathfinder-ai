"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function assessBurnout(symptoms, workload) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!symptoms || !workload) {
    return { success: false, errors: { _form: ["Both symptoms and workload details are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an empathetic Career Wellness and Leadership Coach. You help professionals set boundaries and recover from burnout.",
    task: `Analyze the user's reported symptoms and current workload.
    Assess their burnout risk level. Provide empathetic advice, and generate three specific, highly professional scripts they can use to set boundaries with their manager or team without sounding lazy or uncooperative.`,
    untrustedData: [
      { label: "symptoms", value: symptoms, maxLength: 2000 },
      { label: "workload", value: workload, maxLength: 2000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "riskLevel": "Low / Moderate / High / Critical",
  "empatheticSummary": "A supportive paragraph validating their experience and explaining what is driving the burnout.",
  "immediateActions": ["Action 1", "Action 2"],
  "scripts": [
    { "scenario": "Pushing back on a new project", "script": "The exact words to say..." },
    { "scenario": "Asking for time off / PTO", "script": "The exact words to say..." },
    { "scenario": "Renegotiating current deadlines", "script": "The exact words to say..." }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.burnoutAssessment.create({
      data: {
        userId: user.id,
        symptoms,
        workload,
        assessment: parsedData,
      },
    });

    revalidatePath("/burnout-coach");
    return { success: true, data: record };
  } catch (error) {
    console.error("Burnout Assessment Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to assess burnout"] } };
  }
}

export async function getBurnoutAssessments() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.burnoutAssessment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
