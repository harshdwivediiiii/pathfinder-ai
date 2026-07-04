"use server";
import { handleServerError } from "@/lib/error-handler";
import { validateAuthenticatedUser } from "@/lib/auth-user";
import { isValidAIOutput } from "@/lib/ai-validation";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth-errors";
import { getUserByClerkId } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { validateOutput } from "@/lib/validate";
import { generateGeminiContent } from "@/lib/gemini";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { createErrorResponse } from "@/lib/action-errors";
import { z } from "zod";

const jdDecoderSchema = z.object({
  score: z.number().min(0).max(100),
  redFlags: z.array(z.object({
    phrase: z.string(),
    meaning: z.string(),
  })).default([]),
  greenFlags: z.array(z.object({
    phrase: z.string(),
    meaning: z.string(),
  })).default([]),
  jargonTranslation: z.array(z.object({
    jargon: z.string(),
    translation: z.string(),
  })).default([]),
  realRequirements: z.array(z.string()).default([]),
  verdict: z.string(),
}).strict();

export async function decodeJobDescription(jobDescription) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const limit = await checkRateLimit(userId, "jdDecoder");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Analysis limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  if (!jobDescription || jobDescription.trim().length < 50) {
    return { success: false, errors: { _form: ["Please provide a valid job description (at least 50 characters)."] } };
  }
  
  const user = await getUserByClerkId(userId);
  if (!validateAuthenticatedUser(user)) {
    return createErrorResponse("User not found");
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert career coach, HR insider, and toxicity detector.",
    task: `Analyze the provided Job Description. Uncover hidden red flags (e.g. 'wear many hats' = understaffed, 'fast-paced' = chaotic), green flags (e.g. learning budgets, transparent pay), translate corporate jargon into plain English, and determine the *actual* requirements vs the nice-to-haves. Give an overall Toxicity Risk Score (0 = extremely healthy, 100 = highly toxic). Finally, provide a short verdict on whether they should apply.`,
    untrustedData: [
      { label: "jobDescription", value: jobDescription, maxLength: 50000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "score": 75, // Toxicity Risk Score from 0 to 100
  "redFlags": [
    { "phrase": "Rockstar developer", "meaning": "Will expect you to do the work of 3 people with no boundaries." }
  ],
  "greenFlags": [
    { "phrase": "Annual learning stipend", "meaning": "They actually invest in your career growth." }
  ],
  "jargonTranslation": [
    { "jargon": "Self-starter", "translation": "We have zero onboarding or documentation." }
  ],
  "realRequirements": [
    "You must know React and Node.js (the 10 years of Rust is just a wishlist)."
  ],
  "verdict": "Proceed with caution. The pay might be good, but expect 60-hour weeks."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(jdDecoderSchema, aiResult.response.text());
    
    if (!isValidAIOutput(validation)) {
      console.error("JD Decoder validation failed:", validation.errors);
      return createErrorResponse("AI returned an unexpected format. Please try again.");
    }

    return { success: true, data: validation.data };
  } catch (error) {
    return handleServerError(error, "jd-decoder");
  }
}
