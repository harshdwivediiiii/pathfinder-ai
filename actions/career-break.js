"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function planCareerBreak(duration, reason, returnGoals) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!duration || !reason || !returnGoals) {
    return { success: false, errors: { _form: ["Duration, reason, and return goals are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are a Career Strategist who helps professionals take sabbaticals, parental leave, or health breaks without derailing their career.",
    task: `Analyze the user's plan to take a career break.
    Generate a graceful exit plan for their current role, strategies to stay relevant during the break, and the exact wording to use on their resume and LinkedIn to explain the gap when they return to the workforce.`,
    untrustedData: [
      { label: "duration", value: duration, maxLength: 100 },
      { label: "reason", value: reason, maxLength: 1000 },
      { label: "returnGoals", value: returnGoals, maxLength: 1000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "handoffPlan": ["Action 1 for leaving gracefully", "Action 2"],
  "stayingRelevant": ["Tip 1 for during the break", "Tip 2"],
  "resumeExplanation": "A strong, unapologetic 1-2 sentence explanation to put on their resume.",
  "linkedinHeadline": "A suggested LinkedIn headline or summary addition.",
  "interviewScript": "How to answer 'Can you explain the gap in your resume?' in a future interview."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.careerBreakPlan.create({
      data: {
        userId: user.id,
        duration,
        reason,
        returnGoals,
        planData: parsedData,
      },
    });

    revalidatePath("/career-break");
    return { success: true, data: record };
  } catch (error) {
    console.error("Career Break Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate plan"] } };
  }
}

export async function getCareerBreakPlans() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.careerBreakPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
