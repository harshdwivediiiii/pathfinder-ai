"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { validateAuthenticatedUser } from "@/lib/auth/auth-user";
import { isValidAIOutput } from "@/lib/ai/ai-validation";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth/auth-errors";
import { getUserByClerkId } from "@/lib/auth/user";
import { auth } from "@clerk/nextjs/server";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { validateOutput } from "@/lib/ai/validate";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";
import { z } from "zod";

const translatorSchema = z.object({
  analysis: z.string(),
  translations: z.array(z.object({
    variation: z.string(),
    text: z.string(),
    explanation: z.string()
  })).min(3).max(4)
}).strict();

export async function translateToCorporate(rawText, tone) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const limit = await checkRateLimit(userId, "translator");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Translation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  if (!rawText || rawText.trim().length < 5) {
    return { success: false, errors: { _form: ["Please provide the raw text you want to translate."] } };
  }
  
  const user = await getUserByClerkId(userId);
  if (!validateAuthenticatedUser(user)) {
    return createErrorResponse("User not found");
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert Corporate Diplomat, HR Whisperer, and Communications Coach. Your job is to take raw, frustrated, or overly blunt thoughts and translate them into perfect, HR-friendly corporate speak based on the user's requested tone.",
    task: `Analyze the user's raw text and the desired tone.
    Provide exactly 3 distinct variations of how to say this in a corporate environment.
    Tone context:
    - "Firm Boundary": Professional but strict, setting clear limits.
    - "Polite & Helpful": Softens the blow, highly collaborative, assumes positive intent.
    - "Managerial": Focuses on process, alignment, and delegation.
    - "Passive Aggressive": Highly corporate "as per my last email" energy.
    
    For each variation, provide a short explanation of *why* this phrasing works and what subtext it conveys.`,
    untrustedData: [
      { label: "Raw Text", value: rawText, maxLength: 2000 },
      { label: "Desired Tone", value: tone || "Polite & Helpful", maxLength: 50 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "analysis": "A brief 1-sentence acknowledgement of their raw feeling (e.g. 'It sounds like you are frustrated by being micromanaged.')",
  "translations": [
    {
      "variation": "Direct & Process-Oriented",
      "text": "The translated corporate speak message to copy/paste.",
      "explanation": "Why this works (e.g. 'This removes emotion and focuses entirely on the workflow.')"
    },
    ...
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(translatorSchema, aiResult.response.text());
    
    if (!isValidAIOutput(validation)) {
      console.error("Translator validation failed:", validation.errors);
      return createErrorResponse("AI returned an unexpected format. Please try again.");
    }

    return { success: true, data: validation.data };
  } catch (error) {
    await decrementRateLimit(userId, "translator");
    return handleServerError(error, "translator");
  }
}
