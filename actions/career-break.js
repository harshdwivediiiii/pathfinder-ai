"use server";
import { getAuthenticatedUser } from "@/lib/authenticated-history";
import { handleServerError } from "@/lib/error-handler";
import { returnRecord } from "@/lib/record-response";
import { runAiGeneration } from "@/lib/ai-pipeline";
import { createValidationResponse } from "@/lib/validation-response";
import { executeAiLifecycle } from "@/lib/ai-lifecycle";
import { getUserHistory } from "@/lib/history-query";
import { createJsonOutputRules } from "@/lib/output-rules";
import { executeSecurePrompt } from "@/lib/prompt-execution";
import { executeAiWorkflow } from "@/lib/ai-workflow";
import { createSuccessResponse } from "@/lib/action-success";
import { loadHistory } from "@/lib/history-loader";
import { db } from "@/lib/prisma";
import { createPrompt } from "@/lib/prompt-wrapper";
import { createRecord } from "@/lib/record-create";
import { completePersistence } from "@/lib/persistence-complete";
import { auth } from "@clerk/nextjs/server";
import { createErrorResponse } from "@/lib/action-errors";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUserId } from "@/lib/auth-userid";
import { createPromptConfig } from "@/lib/prompt-config";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserFilter } from "@/lib/user-filter";
import { parseAiOutput } from "@/lib/ai-output";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth-errors";
import { createOutputRules } from "@/lib/output-rules";
import { createHistoryResponse } from "@/lib/history-response";

import { buildParsedResult } from "@/lib/parsed-ai";
/** Generate a career break plan based on user preferences. */
export async function planCareerBreak(duration, reason, returnGoals) {
  const userId = await getAuthenticatedUserId(auth);
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  if (!duration || !reason || !returnGoals) {
  return createValidationResponse(
    "Duration, reason, and return goals are required."
  );
}

  const prompt = createPrompt(
  createPromptConfig({
    context:
      "You are a Career Strategist who helps professionals take sabbaticals, parental leave, or health breaks without derailing their career.",

    task: `Analyze the user's plan to take a career break.

    Generate a graceful exit plan for their current role, strategies to stay relevant during the break, and the exact wording to use on their resume and LinkedIn to explain the gap when they return to the workforce.`,

    untrustedData: [
      { label: "duration", value: duration, maxLength: 100 },
      { label: "reason", value: reason, maxLength: 1000 },
      { label: "returnGoals", value: returnGoals, maxLength: 1000 },
    ],

    outputRules: createOutputRules(`Provide the output in the following JSON format ONLY:

{
  "handoffPlan": ["Action 1 for leaving gracefully", "Action 2"],
  "stayingRelevant": ["Tip 1 for during the break", "Tip 2"],
  "resumeExplanation": "A strong, unapologetic 1-2 sentence explanation to put on their resume.",
  "linkedinHeadline": "A suggested LinkedIn headline or summary addition.",
  "interviewScript": "How to answer 'Can you explain the gap in your resume?' in a future interview."
}`),
  })
);

  try {
    const aiResult = await runAiGeneration(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await createRecord(db.careerBreakPlan, {
  userId: user.id,
  duration,
  reason,
  returnGoals,
  ...withParsedData("result", parsedData),
});

    revalidatePath("/career-break");
    return createHistoryResponse(record);
  } catch (error) {
    return handleServerError(error, "career-break");
  }
}
/** Retrieve all career break plans for the current user. */

export async function getCareerBreakPlans() {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, data: [] };

  const records = await getUserHistory(
    db.careerBreakPlan,
    user.id,
    { createdAt: "desc" }
  );

  return createHistoryResponse(records);
}

  return { success: true, data: records };

