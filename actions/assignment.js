"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { mapParsedOutput } from "@/lib/ai/field-mapping";
import { ACTION_CONTEXT } from "@/lib/action-helpers/action-context";
import { getAiResponseText } from "@/lib/ai/ai-response";
import { db } from "@/lib/db/prisma";
import { finalizeAiPersistence } from "@/lib/ai/ai-persistence";
import { requireAuthenticatedUser } from "@/lib/auth/authenticated-user";
import { buildUserLookup } from "@/lib/db/user-query";
import { getAuthenticatedHistoryResponse } from "@/lib/history/history-response-auth";
import { createSuccessResponse } from "@/lib/action-helpers/action-success";
import { auth } from "@clerk/nextjs/server";
import { logActionError } from "@/lib/action-helpers/action-logger";
import { revalidatePath } from "next/cache";
import { EMPTY_HISTORY_RESPONSE } from "@/lib/history/history-response";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { revalidateAppPath } from "@/lib/db/cache-revalidate";
import { getAuthenticatedHistoryUser } from "@/lib/history/history-auth";
import { buildHistoryResponse } from "@/lib/history/history-loader";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { getHistoryRecords } from "@/lib/history/history-query";
import { USER_NOT_FOUND_RESPONSE } from "@/lib/errors/user-not-found";

/** Grade an assignment submission against a rubric or prompt. */
export async function gradeAssignment(promptText, solutionText) {
  const init = await initializeAuthenticatedAction();
  if ("success" in init) return init;

  const { user } = init;

  if (!promptText || !solutionText) {
    return { success: false, errors: { _form: ["Both prompt and solution are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are a Senior Staff Engineer or Consulting Partner grading a candidate's take-home assignment.",
    task: `Analyze the provided prompt/instructions and the candidate's proposed solution.
    Grade the solution out of 100, provide a critical analysis of edge cases they missed, logic gaps, and suggest optimizations to make it perfect.`,
    untrustedData: [
      { label: "assignmentPrompt", value: promptText, maxLength: 5000 },
      { label: "candidateSolution", value: solutionText, maxLength: 10000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "score": 85,
  "overallFeedback": "A brief summary of your impression of the solution.",
  "strengths": ["What they did well 1", "What they did well 2"],
  "edgeCasesMissed": ["Edge case 1 they didn't handle", "Edge case 2"],
  "optimizations": ["Optimization 1", "Optimization 2"],
  "finalVerdict": "Pass / Borderline / Fail"
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(getAiResponseText(aiResult));

    const record = await db.assignmentGrade.create({
  data: {
    userId: user.id,
    prompt: promptText,
    solution: solutionText,
    ...mapParsedOutput("gradeData", parsedData),
  },
});

    finalizeAiPersistence("/assignment-grader");
    return { success: true, data: record };
  } catch (error) {
    return handleServerError(error, ACTION_CONTEXT.ASSIGNMENT);
  }
/** Retrieve all graded assignments for the current user. */
}

export async function getAssignmentGrades() {
  const { userId } = await auth();
  if (!userId) return EMPTY_HISTORY_RESPONSE;

  const user = await db.user.findUnique(buildUserLookup(userId));
  if (!user) return { success: false, data: [] };

  const records = await getHistoryRecords(
  db.assignmentGrade,
  user.id
);

  return buildHistoryResponse(records);
}
