"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateOnboardingPlan(company, role) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!company || !role) {
    return { success: false, errors: { _form: ["Company and Role are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert executive coach and onboarding strategist.",
    task: `Create a highly strategic 30-60-90 day onboarding plan for a candidate starting as a '${role}' at '${company}'.
    The plan should focus on learning the culture in the first 30 days, contributing in the first 60 days, and leading/innovating by 90 days.`,
    untrustedData: [
      { label: "company", value: company, maxLength: 100 },
      { label: "role", value: role, maxLength: 100 },
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
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.onboardingPlan.create({
      data: {
        userId: user.id,
        company,
        role,
        planContent: parsedData,
      },
    });

    revalidatePath("/onboarding-plan");
    return { success: true, data: record };
  } catch (error) {
    console.error("Onboarding Plan Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate onboarding plan"] } };
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
