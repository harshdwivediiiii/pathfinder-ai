"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function gradeAssignment(promptText, solutionText) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

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
}

export async function getAssignmentGrades() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.assignmentGrade.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
