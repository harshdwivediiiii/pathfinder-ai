"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { getAiResponseText } from "@/lib/ai/ai-response";
import { ACTION_CONTEXT } from "@/lib/action-helpers/action-context";
import { db } from "@/lib/db/prisma";
import { finalizeAiPersistence } from "@/lib/ai/ai-persistence";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getHistoryRecords } from "@/lib/history-query";
import { buildUserLookup } from "@/lib/user-query";
import { buildHistoryResponse } from "@/lib/history-loader";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { USER_NOT_FOUND_RESPONSE } from "@/lib/user-not-found";
import { CREATED_AT_DESC } from "@/lib/sort-config";
import { EMPTY_HISTORY_RESPONSE } from "@/lib/history-response";
import { getHistoryRecords } from "@/lib/history/history-query";
import { buildUserLookup } from "@/lib/db/user-query";
import { buildHistoryResponse } from "@/lib/history/history-loader";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";
import { USER_NOT_FOUND_RESPONSE } from "@/lib/errors/user-not-found";
import { EMPTY_HISTORY_RESPONSE } from "@/lib/history/history-response";

/** Assess burnout risk based on user survey responses. */
export async function assessBurnout(symptoms, workload) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique(buildUserLookup(userId));
  if (!user) return USER_NOT_FOUND_RESPONSE;

  const limit = await checkRateLimit(userId, "burnout");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Burnout assessment limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

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
    const parsedData = parseAIJson(getAiResponseText(aiResult));

    const record = await db.burnoutAssessment.create({
      data: {
        userId: user.id,
        symptoms,
        workload,
        assessment: parsedData,
      },
    });

    finalizeAiPersistence("/burnout-coach");
    return { success: true, data: record };
  } catch (error) {
    await decrementRateLimit(userId, "burnout");
    return handleServerError(error, ACTION_CONTEXT.BURNOUT);
  }
}
/** Retrieve all burnout assessments for the current user. */

export async function getBurnoutAssessments() {
  const { userId } = await auth();
  if (!userId) return EMPTY_HISTORY_RESPONSE;

  const user = await db.user.findUnique(buildUserLookup(userId));
  if (!user) return { success: false, data: [] };

  const records = await getHistoryRecords(
    db.burnoutAssessment,
    user.id
  );
  db.burnoutAssessment,
  user.id
);

  return buildHistoryResponse(records);
}
