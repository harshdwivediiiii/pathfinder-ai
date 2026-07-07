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
import { db } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const toxicEscapeSchema = z.object({
  toxicityScore: z.number().min(0).max(100),
  validationMessage: z.string(),
  immediateBoundaries: z.array(z.object({
    situation: z.string(),
    script: z.string(),
  })).default([]),
  mentalTriage: z.array(z.string()).default([]),
  covertSearch: z.array(z.string()).default([]),
  exitStrategy: z.array(z.string()).default([]),
  resignationScript: z.string()
}).strict();

export async function generateEscapePlan(symptoms, role, timeline) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const limit = await checkRateLimit(userId, "toxicEscape");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Plan generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  if (!symptoms || symptoms.trim().length < 20) {
    return { success: false, errors: { _form: ["Please describe the toxic traits in more detail (at least 20 characters)."] } };
  }
  
  const user = await getUserByClerkId(userId);
  if (!validateAuthenticatedUser(user)) {
    return createErrorResponse("User not found");
  }

  const prompt = buildSecurePrompt({
    context: "You are an empathetic, strategic career coach and HR expert helping a client escape a highly toxic work environment.",
    task: `Analyze the user's toxic workplace symptoms, role, and exit timeline. Validate their feelings (it's not their fault), assess the severity (Toxicity Score 0-100), and create a tactical survival and escape plan.
    Provide:
    1. Immediate boundary-setting scripts (what to say to push back on bad behavior).
    2. Mental health triage (how to detach emotionally).
    3. Covert job search tips (how to interview without getting caught).
    4. Exit strategy steps based on their timeline.
    5. A professional resignation script that doesn't burn bridges but protects their peace.`,
    untrustedData: [
      { label: "Symptoms", value: symptoms, maxLength: 5000 },
      { label: "Role", value: role || user.currentRole || "Employee", maxLength: 200 },
      { label: "Timeline", value: timeline, maxLength: 100 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "toxicityScore": 85, // 0-100 scale (100 is extremely toxic)
  "validationMessage": "A deeply empathetic 2-3 sentence message validating their experience and reminding them they deserve better.",
  "immediateBoundaries": [
    {
      "situation": "When asked to work late on a Friday",
      "script": "I have a hard stop at 5pm today, but I will prioritize this first thing Monday morning."
    }
  ],
  "mentalTriage": [
    "Stop checking emails after hours.",
    "Practice 'quiet quitting' / doing the bare minimum."
  ],
  "covertSearch": [
    "Schedule interviews during your lunch break away from the office.",
    "Do not update your LinkedIn profile picture or title yet."
  ],
  "exitStrategy": [
    "Step 1: Secure an offer...",
    "Step 2: Backup your personal files..."
  ],
  "resignationScript": "The script to say to their manager when resigning."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(toxicEscapeSchema, aiResult.response.text());
    
    if (!isValidAIOutput(validation)) {
      console.error("Toxic Escape validation failed:", validation.errors);
      return createErrorResponse("AI returned an unexpected format. Please try again.");
    }

    // Save to database
    const record = await db.toxicWorkplaceEscape.create({
      data: {
        userId: user.id,
        symptoms: symptoms,
        role: role || user.currentRole || "Employee",
        escapeData: validation.data
      }
    });

    revalidatePath("/toxic-workplace");
    return { success: true, data: { ...validation.data, id: record.id } };
  } catch (error) {
    return handleServerError(error, "toxic-escape");
  }
}

export async function getEscapePlans() {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const user = await getUserByClerkId(userId);
  if (!validateAuthenticatedUser(user)) {
    return createErrorResponse("User not found");
  }

  try {
    const records = await db.toxicWorkplaceEscape.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: records };
  } catch (error) {
    return handleServerError(error, "get-escape-plans");
  }
}
