"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { getAiResponseText } from "@/lib/ai-response";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";
import { buildUserLookup } from "@/lib/db/user-query";
import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { getAiResponseText } from "@/lib/ai/ai-response";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { careerDecisionSchema } from "@/lib/schemas/forms";
import { careerDecisionOutputSchema } from "@/lib/schemas/outputs";
import { validateInput } from "@/lib/ai/validate";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";
import { getAuthenticatedUserId } from "@/lib/auth/auth-userid";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth/auth-errors";
import { createSuccessResponse } from "@/lib/action-helpers/action-success";
import { getUserHistory } from "@/lib/history/history-query";
import { createHistoryResponse } from "@/lib/history/history-response";
import { createRecord } from "@/lib/db/record-create";

export async function simulateCareerDecision(input) {
  const userId = await getAuthenticatedUserId(auth);
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const user = await db.user.findUnique(buildUserLookup(userId));
  if (!user) return createErrorResponse("User not found");

  const rateLimitResult = await checkRateLimit(userId, "careerDecisionSimulator");
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      errors: {
        _form: [
          `Rate limit exceeded. Try again in ${formatResetTime(rateLimitResult.resetAt)}.`,
        ],
      },
    };
  }

  // Validate input with schema
  const validation = validateInput(careerDecisionSchema, input);
  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  const { question, options } = validation.data;

  const prompt = buildSecurePrompt({
    context: "You are an expert career strategist and executive coach.",
    task: `Analyze the user's career decision question and the provided options. Evaluate each option objectively, outlining the pros, cons, risk level, short-term impact, long-term impact, and skills required.
    Finally, recommend the best option, provide a detailed reasoning, suggest a concrete next step, and give a confidence score (0-100) based on your analysis.`,
    untrustedData: [
      { label: "question", value: question, maxLength: 1000 },
      { label: "options", value: JSON.stringify(options), maxLength: 5000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "optionsAnalysis": [
    {
      "option": "string (the exact option text)",
      "pros": ["string"],
      "cons": ["string"],
      "riskLevel": "High" | "Medium" | "Low",
      "shortTermImpact": "string",
      "longTermImpact": "string",
      "skillsRequired": ["string"]
    }
  ],
  "recommendedOption": "string (the recommended option)",
  "reasoning": "string (detailed explanation)",
  "nextStep": "string (immediate actionable step)",
  "confidenceScore": number (0 to 100)
}`
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(getAiResponseText(aiResult));

    const outputValidation = careerDecisionOutputSchema.safeParse(parsedData);
    if (!outputValidation.success) {
      console.error("AI output validation failed", outputValidation.error);
      return createErrorResponse("Failed to parse analysis from AI. Please try again.");
    }

    const record = await createRecord(db.careerDecisionSimulation, {
      userId: user.id,
      question,
      options,
      analysis: outputValidation.data,
    });

    revalidatePath("/career-decision-simulator");
    revalidatePath("/dashboard");
    return createSuccessResponse(record);
  } catch (error) {
    await decrementRateLimit(userId, "careerDecisionSimulator");
    return handleServerError(error, "career-decision-simulator");
  }
}

export async function getCareerDecisionSimulations() {
  const userId = await getAuthenticatedUserId(auth);
  if (!userId) return createHistoryResponse([]);

  const user = await db.user.findUnique(buildUserLookup(userId));
  if (!user) return createHistoryResponse([]);

  const records = await getUserHistory(
    db.careerDecisionSimulation,
    user.id,
    { createdAt: "desc" }
  );

  return createHistoryResponse(records);
}
