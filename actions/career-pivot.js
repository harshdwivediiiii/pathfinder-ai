"use server";
import { handleServerError } from "@/lib/error-handler";
import { runAiGeneration } from "@/lib/ai-pipeline";
import { loadHistory } from "@/lib/history-loader";
import { getUserHistory } from "@/lib/history-query";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createPromptConfig } from "@/lib/prompt-config";
import { revalidatePath } from "next/cache";
import { createOutputRules } from "@/lib/output-rules";
import { createErrorResponse } from "@/lib/action-errors";
import { createRecord } from "@/lib/record-create";
import { getAuthenticatedUserId } from "@/lib/auth-userid";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth-errors";
import { parseAiOutput } from "@/lib/ai-output";

/** Generate a career pivot strategy based on user goals. */
export async function generatePivotStrategy(currentRole, targetRole) {
  const userId = await getAuthenticatedUserId(auth);
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  if (!currentRole || !targetRole) {
    return { success: false, errors: { _form: ["Both current and target roles are required."] } };
  }

  const prompt = buildSecurePrompt(
  createPromptConfig({
    context: "You are an expert career transition coach.",
    task: `Analyze a career pivot from '${currentRole}' to '${targetRole}'. 
    Identify the hidden transferable skills the candidate already has, the major skill gaps they need to close, and a step-by-step roadmap to make the transition.`,
    untrustedData: [
      { label: "currentRole", value: currentRole, maxLength: 100 },
      { label: "targetRole", value: targetRole, maxLength: 100 },
    ],
    outputRules: createOutputRules(`Provide the output in the following JSON format ONLY:
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
}`),
  })
);

  try {
    const aiResult = await runAiGeneration(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await createRecord(db.careerPivot, {
  userId: user.id,
  currentRole,
  targetRole,
  result: parsedData,
});

    revalidatePath("/career-pivot");
    return { success: true, data: record };
  } catch (error) {
    return handleServerError(error, "career-pivot");
  }
}

export async function getCareerPivots() {
  const userId = await getAuthenticatedUserId(auth);
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await getUserHistory(
  db.careerPivot,
  user.id,
  { createdAt: "desc" }
);

  return loadHistory(async () => {
  const records = await db.careerBreakPlan.findMany(...);

  return { success: true, data: records };
});
}
