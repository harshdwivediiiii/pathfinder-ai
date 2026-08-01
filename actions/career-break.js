"use server";
import { getAuthenticatedUser } from "@/lib/auth/authenticated-history";
import { handleServerError } from "@/lib/errors/error-handler";
import { DEFAULT_PROMPT_CONFIG } from "@/lib/ai/prompt-defaults";
import { returnRecord } from "@/lib/action-helpers/record-response";
import { runAiGeneration } from "@/lib/ai/ai-pipeline";
import { createJsonOutputRules } from "@/lib/ai/output-rules";
import { createValidationResponse } from "@/lib/errors/validation-response";
import { executeAiLifecycle } from "@/lib/ai/ai-lifecycle";
import { getUserHistory } from "@/lib/history/history-query";
import { executeSecurePrompt } from "@/lib/ai/prompt-execution";
import { executeAiWorkflow } from "@/lib/ai/ai-workflow";
import { createSuccessResponse } from "@/lib/action-helpers/action-success";
import { loadHistory } from "@/lib/history/history-loader";
import { db } from "@/lib/db/prisma";
import { parseAiResponse } from "@/lib/ai/ai-json";
import { createPrompt } from "@/lib/ai/prompt-wrapper";
import { createRecord } from "@/lib/db/record-create";
import { completePersistence } from "@/lib/persistence/persistence-complete";
import { auth } from "@clerk/nextjs/server";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUserId } from "@/lib/auth/auth-userid";
import { createPromptConfig } from "@/lib/ai/prompt-config";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { buildUserFilter } from "@/lib/db/user-filter";
import { parseAiOutput } from "@/lib/ai/ai-output";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth/auth-errors";
import { createOutputRules } from "@/lib/ai/output-rules";
import { createHistoryResponse } from "@/lib/history/history-response";

import { buildParsedResult } from "@/lib/ai/parsed-ai";
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

    outputRules: createOutputRules(
  createJsonOutputRules(`{

{
  "handoffPlan": ["Action 1 for leaving gracefully", "Action 2"],
  "stayingRelevant": ["Tip 1 for during the break", "Tip 2"],
  "resumeExplanation": "A strong, unapologetic 1-2 sentence explanation to put on their resume.",
  "linkedinHeadline": "A suggested LinkedIn headline or summary addition.",
  "interviewScript": "How to answer 'Can you explain the gap in your resume?' in a future interview."
}`)),
  })
);

  try {
    const aiResult = await runAiGeneration(prompt);
    const parsedData = parseAiResponse(aiResult);
    

    const record = await createRecord(db.careerBreakPlan, {
  userId: user.id,
  duration,
  reason,
  returnGoals,
  ...buildParsedResult("result", parsedData),
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
