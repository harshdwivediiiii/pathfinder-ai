"use server";
import { handleServerError } from "@/lib/error-handler";
import { createErrorResponse } from "@/lib/action-errors";

import { db } from "@/lib/prisma";
import { createAiValidationError } from "@/lib/ai-validation-response";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { validateOutput } from "@/lib/validate";
import { onboardingPlanOutputSchema } from "@/lib/schemas/outputs";

export async function generateOnboardingPlan(company, role) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  const trimmedCompany = company?.trim();
  const trimmedRole = role?.trim();

  if (!trimmedCompany || trimmedCompany.length > 100) {
    return { success: false, errors: { _form: ["Company name is required and must be under 100 characters."] } };
  }
  if (!trimmedRole || trimmedRole.length > 100) {
    return { success: false, errors: { _form: ["Job title is required and must be under 100 characters."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert executive coach and onboarding strategist.",
    task: `Create a highly strategic 30-60-90 day onboarding plan for a candidate starting as a '${trimmedRole}' at '${trimmedCompany}'.
    The plan should focus on learning the culture in the first 30 days, contributing in the first 60 days, and leading/innovating by 90 days.`,
    untrustedData: [
      { label: "company", value: trimmedCompany, maxLength: 100 },
      { label: "role", value: trimmedRole, maxLength: 100 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "day30": {
    "focus": "Main theme for first 30 days",
    "goals": ["Goal 1", "Goal 2", "Goal 3"]
  },
  "day60": {
    "focus": "Main theme for days 31-60",
    "goals": ["Goal 1", "Goal 2", "Goal 3"]
  },
  "day90": {
    "focus": "Main theme for days 61-90",
    "goals": ["Goal 1", "Goal 2", "Goal 3"]
  }
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(onboardingPlanOutputSchema, aiResult.response.text());

    if (!validation.success) {
      return createAiValidationError();
    }

    const record = await db.onboardingPlan.create({
      data: {
        userId: user.id,
        company: trimmedCompany,
        role: trimmedRole,
        planContent: validation.data,
      },
    });

    revalidatePath("/onboarding-plan");
    return { success: true, data: record };
  } catch (error) {
    return handleServerError(error, "onboarding");
  }
}

export async function getOnboardingPlans() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.onboardingPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
