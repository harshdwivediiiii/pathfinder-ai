"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateEscapePlan(symptoms, role) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!symptoms || !role) {
    return { success: false, errors: { _form: ["Symptoms and role are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Expert Career Coach specializing in workplace psychology, boundary setting, and discrete career transitions.",
    task: `Analyze the user's role and the symptoms they are experiencing at their current workplace.
    Validate if the environment is toxic based on their input. Then, generate a fast-track, discreet escape strategy to help them protect their mental health, set immediate boundaries, and execute a quiet job hunt.`,
    untrustedData: [
      { label: "symptoms", value: symptoms, maxLength: 2000 },
      { label: "role", value: role, maxLength: 500 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "toxicityAssessment": "A compassionate, validating paragraph analyzing whether the described behavior constitutes a toxic workplace or just a high-stress environment.",
  "immediateBoundaries": ["Boundary 1 to set tomorrow", "Boundary 2"],
  "quietExitStrategy": [
    { "phase": "Weeks 1-2: The Setup", "action": "What to do first" },
    { "phase": "Weeks 3-4: The Hunt", "action": "What to do next" },
    { "phase": "Weeks 5+: The Escape", "action": "Final steps" }
  ],
  "resignationScript": "A highly professional, neutral resignation script that doesn't burn bridges but offers absolutely zero room for negotiation or counter-offers."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.toxicWorkplaceEscape.create({
      data: {
        userId: user.id,
        symptoms,
        role,
        escapeData: parsedData,
      },
    });

    revalidatePath("/toxic-workplace");
    return { success: true, data: record };
  } catch (error) {
    console.error("Toxic Workplace Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate escape plan"] } };
  }
}

export async function getEscapePlans() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.toxicWorkplaceEscape.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
