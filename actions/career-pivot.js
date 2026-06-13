"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generatePivotStrategy(currentRole, targetRole) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!currentRole || !targetRole) {
    return { success: false, errors: { _form: ["Both current and target roles are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert career transition coach.",
    task: `Analyze a career pivot from '${currentRole}' to '${targetRole}'. 
    Identify the hidden transferable skills the candidate already has, the major skill gaps they need to close, and a step-by-step roadmap to make the transition.`,
    untrustedData: [
      { label: "currentRole", value: currentRole, maxLength: 100 },
      { label: "targetRole", value: targetRole, maxLength: 100 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "transferableSkills": [
    "Skill 1 (and how it translates)",
    "Skill 2 (and how it translates)"
  ],
  "skillGaps": [
    "Gap 1 (what to learn)",
    "Gap 2 (what to learn)"
  ],
  "roadmap": [
    { "step": "Phase 1: Foundation", "action": "What to do first" },
    { "step": "Phase 2: Portfolio", "action": "What to build or prove" },
    { "step": "Phase 3: Networking & Application", "action": "How to position yourself" }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.careerPivot.create({
      data: {
        userId: user.id,
        currentRole,
        targetRole,
        analysis: parsedData,
      },
    });

    revalidatePath("/career-pivot");
    return { success: true, data: record };
  } catch (error) {
    console.error("Career Pivot Generation Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate pivot strategy"] } };
  }
}

export async function getCareerPivots() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.careerPivot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
