"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { buildSecurePrompt, generateWithStructuredOutput } from "@/lib/ai/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/security/rate-limit-actions";
import { validateInput, validateOutput } from "@/lib/ai/validate";
import { assertFeatureEnabled } from "@/lib/ai/ai-gating";
import { skillGapAnalysisSchema } from "@/lib/schemas/forms";
import { skillGapAnalysisOutputSchema, SCHEMA_DESCRIPTIONS } from "@/lib/schemas/outputs";
import { AppError } from "@/lib/errors/app-error";

export async function generateSkillGapAnalysis(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    try {
      assertFeatureEnabled("skillGapAnalysis");
    } catch (err) {
      return handleServerError(err, "skill-gap");
    }

    const validation = validateInput(skillGapAnalysisSchema, data);
    if (!validation.success) return { success: false, errors: validation.errors };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const limit = await checkRateLimit(userId, "skill-gap");
    if (!limit.allowed) {
      throw new Error(`Limit reached. Resets in ${formatResetTime(limit.resetAt)}.`);
    }

    const profileContext = buildUserProfileContext(user);

    const prompt = buildSecurePrompt({
      context: `${profileContext}\n\nYou are an expert career coach and technical mentor analyzing a candidate's skill gap.`,
      task: "Compare the candidate's current skills against the target role requirements, and generate a structured skill gap analysis.",
      untrustedData: [
        { label: "currentSkills", value: data.currentSkills, maxLength: 1000 },
        { label: "targetRole", value: data.targetRole, maxLength: 200 },
        { label: "jobDescription", value: data.jobDescription || "Not provided", maxLength: 3000 },
        { label: "learningDuration", value: data.learningDuration || "1 month", maxLength: 100 },
      ],
      outputRules: SCHEMA_DESCRIPTIONS.skillGapAnalysis,
    });

    const result = await generateWithStructuredOutput({
      prompt,
      schemaDescription: SCHEMA_DESCRIPTIONS.skillGapAnalysis,
      schema: skillGapAnalysisOutputSchema,
      generateFn: async (p) => {
        const raw = await generateGeminiContent(p);
        return raw.response.text().trim();
      },
      validateFn: validateOutput,
    });

    if (!result.success) {
      console.error("Skill gap analysis output validation failed:", result.errors);
      throw new AppError("AI returned an unexpected format.", 500);
    }

    const analysisJson = typeof result.data === "string" ? JSON.parse(result.data) : result.data;

    const saved = await db.skillGapAnalysis.upsert({
      where: { userId: user.id },
      update: {
        currentSkills: data.currentSkills,
        targetRole: data.targetRole,
        jobDescription: data.jobDescription,
        learningDuration: data.learningDuration,
        analysis: analysisJson,
      },
      create: {
        userId: user.id,
        currentSkills: data.currentSkills,
        targetRole: data.targetRole,
        jobDescription: data.jobDescription,
        learningDuration: data.learningDuration,
        analysis: analysisJson,
      },
    });

    return { data: saved, error: null };
  } catch (error) {
    return handleServerError(error, "skill-gap");
  }
}

export async function getSkillGapAnalysis() {
  try {
    const { userId } = await auth();
    if (!userId) return { data: null, error: "Unauthorized" };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return { data: null, error: "User not found" };

    const analysis = await db.skillGapAnalysis.findUnique({
      where: { userId: user.id },
    });

    return { data: analysis, error: null };
  } catch (error) {
    return handleServerError(error, "skill-gap");
  }
}
