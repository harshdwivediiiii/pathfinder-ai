"use server";
import { executeSecurePrompt } from "@/lib/ai/prompt-execution";
import { returnRecord } from "@/lib/action-helpers/record-response";
import { handleServerError } from "@/lib/errors/error-handler";
import { createJsonOutputRules } from "@/lib/ai/output-rules";
import { executeAiWorkflow } from "@/lib/ai/ai-workflow";
import { PROMPT_CONTEXTS } from "@/lib/ai/prompt-contexts";
import { executeAiLifecycle } from "@/lib/ai/ai-lifecycle";
import { createValidationResponse } from "@/lib/errors/validation-response";
import { runAiGeneration } from "@/lib/ai/ai-pipeline";
import { DEFAULT_PROMPT_CONFIG } from "@/lib/ai/prompt-defaults";
import { loadHistory } from "@/lib/history/history-loader";
import { getUserHistory } from "@/lib/history/history-query";
import { createSuccessResponse } from "@/lib/action-helpers/action-success";
import { db } from "@/lib/db/prisma";
import { parseAiResponse } from "@/lib/ai/ai-json";
import { buildParsedResult } from "@/lib/ai/parsed-ai";
import { auth } from "@clerk/nextjs/server";
import { createHistoryResponse } from "@/lib/history/history-response";
import { createPromptConfig } from "@/lib/ai/prompt-config";
import { revalidatePath } from "next/cache";
import { createOutputRules } from "@/lib/ai/output-rules";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";
import { completePersistence } from "@/lib/persistence/persistence-complete";
import { createRecord } from "@/lib/db/record-create";
import { getAuthenticatedUserId } from "@/lib/auth/auth-userid";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth/auth-errors";
import { parseAiOutput } from "@/lib/ai/ai-output";
import { getAuthenticatedUser } from "@/lib/auth/authenticated-history";

/** Generate a career pivot strategy based on user goals. */
export async function generatePivotStrategy(currentRole, targetRole) {
  const userId = await getAuthenticatedUserId(auth);
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  if (!currentRole || !targetRole) {
    return createValidationResponse(
    "Both current and target roles are required."
  );
  }

  const aiResult = await runAiGeneration(
    createPromptConfig({
      context: "You are an expert career transition coach.",
      task: `Analyze a career pivot from '${currentRole}' to '${targetRole}'.
      Identify the hidden transferable skills the candidate already has, the major skill gaps they need to close, and a step-by-step roadmap to make the transition.`,
      untrustedData: [
        { label: "currentRole", value: currentRole, maxLength: 100 },
        { label: "targetRole", value: targetRole, maxLength: 100 },
      ],
      outputRules: createJsonOutputRules(`Provide the output in the following JSON format ONLY:
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
  const parsedData = parseAiResponse(aiResult);

  const record = await createRecord(db.careerPivot, {
  userId: user.id,
  currentRole,
  targetRole,
  ...withParsedData("analysis", parsedData),
});

  revalidatePath("/career-pivot");
  return createSuccessResponse(record);
}

export async function getCareerPivots() {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, data: [] };

  const records = await getUserHistory(
  db.careerPivot,
  user.id,
  { createdAt: "desc" }
);

  return createHistoryResponse(records);
}
