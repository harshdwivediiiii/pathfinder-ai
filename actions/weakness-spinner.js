"use server";
import { getUserByClerkId } from "@/lib/auth/user";
const UNAUTHORIZED_RESPONSE = { success: false, errors: { _form: ["Unauthorized"] } };
import { auth } from "@clerk/nextjs/server";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { validateOutput } from "@/lib/ai/validate";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { checkRateLimit, formatResetTime } from "@/lib/security/rate-limit-actions";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";
import { z } from "zod";

const weaknessSpinnerSchema = z.object({
  analysis: z.string(),
  systemBuilder: z.object({
    answer: z.string(),
    explanation: z.string()
  }),
  hiddenStrength: z.object({
    answer: z.string(),
    explanation: z.string()
  }),
  growthStory: z.object({
    answer: z.string(),
    explanation: z.string()
  })
}).strict();

export async function spinWeakness(targetRole, rawWeakness) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const limit = await checkRateLimit(userId, "weaknessSpinner");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Spin limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  if (!targetRole || !rawWeakness || rawWeakness.trim().length < 5) {
    return { success: false, errors: { _form: ["Please provide a target role and your real weakness."] } };
  }
  
  const user = await getUserByClerkId(userId);
  if (!user) {
    return createErrorResponse("User not found");
  }

  const prompt = buildSecurePrompt({
    context: "You are an elite interview coach and 'Spin Doctor'. Your job is to take a candidate's brutally honest, raw weakness and reframe it into a brilliant, authentic, and highly professional interview answer tailored to their target role.",
    task: `Analyze the user's raw weakness and target role.
    Provide exactly 3 distinct 'spun' angles to answer the dreaded 'What is your biggest weakness?' question.
    
    Categories:
    1. The System Builder Angle: Focus on the specific tools, workflows, or systems the candidate built to overcome this weakness.
    2. The Hidden Strength Angle: Reframe this specific weakness as a superpower that is actually beneficial for this specific Target Role.
    3. The Growth Story: A STAR-method mini-story showing a recent time they struggled with it, and the exact steps they took to fix it.
    
    Make the answers sound authentic and conversational, not robotic.`,
    untrustedData: [
      { label: "Target Role", value: targetRole, maxLength: 100 },
      { label: "Raw Weakness", value: rawWeakness, maxLength: 500 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "analysis": "A brief 1-sentence validation of their real weakness (e.g. 'It is totally normal to struggle with time management, but recruiters want to see how you mitigate it.')",
  "systemBuilder": {
    "answer": "The exact script to say.",
    "explanation": "Why this works for the target role."
  },
  "hiddenStrength": {
    "answer": "The exact script to say.",
    "explanation": "Why this works for the target role."
  },
  "growthStory": {
    "answer": "The exact script to say.",
    "explanation": "Why this works for the target role."
  }
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(weaknessSpinnerSchema, aiResult.response.text());
    
    if (!validation.success) {
      console.error("Weakness Spinner validation failed:", validation.errors);
      return createErrorResponse("AI returned an unexpected format. Please try again.");
    }

    return { success: true, data: validation.data };
  } catch (error) {
    console.error("weakness-spinner error:", error);
    return createErrorResponse("An unexpected error occurred.");
  }
}
