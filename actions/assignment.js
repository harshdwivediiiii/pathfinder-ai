"use server";

import { db } from "@/lib/prisma";
import { buildUserLookup } from "@/lib/user-query";
import { getAuthenticatedHistoryResponse } from "@/lib/history-response-auth";
import { createSuccessResponse } from "@/lib/action-success";
import { auth } from "@clerk/nextjs/server";
import { logActionError } from "@/lib/action-logger";
import { revalidatePath } from "next/cache";
import { EMPTY_HISTORY_RESPONSE } from "@/lib/history-response";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { revalidateAppPath } from "@/lib/cache-revalidate";
import { getAuthenticatedHistoryUser } from "@/lib/history-auth";
import { buildHistoryResponse } from "@/lib/history-loader";
import { generateGeminiContent } from "@/lib/gemini";
import { getHistoryRecords } from "@/lib/history-query";
import { USER_NOT_FOUND_RESPONSE } from "@/lib/user-not-found";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

/** Grade an assignment submission against a rubric or prompt. */
export async function gradeAssignment(promptText, solutionText) {
  const user = await getAuthenticatedHistoryUser();
  if (!user) return USER_NOT_FOUND_RESPONSE;

  const { userId } = await auth();
  const limit = await checkRateLimit(userId, "assignment");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Assignment grading limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

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
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.assignmentGrade.create({
      data: {
        userId: user.id,
        prompt: promptText,
        solution: solutionText,
        gradeData: parsedData,
      },
    });

    revalidatePath("/assignment-grader");
    return { success: true, data: record };
  } catch (error) {
    console.error("Assignment Grader Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to grade assignment"] } };
  }
/** Retrieve all graded assignments for the current user. */
}

export async function getAssignmentGrades() {
  const { userId } = await auth();
  if (!userId) return EMPTY_HISTORY_RESPONSE;

  const user = await db.user.findUnique(buildUserLookup(userId));
  if (!user) return { success: false, data: [] };

  const records = await getHistoryRecords(
  db.assignment,
  user.id
);

  return buildHistoryResponse(records);
}
