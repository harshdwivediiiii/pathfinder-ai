"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { USER_NOT_FOUND_MESSAGE } from "@/lib/errors/errors";
import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/security/rate-limit-actions";
import { validateInput } from "@/lib/ai/validate";
import { skillGapAnalysisSchema } from "@/lib/schemas/forms";

export async function generateSkillGapAnalysis(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const limit = await checkRateLimit(userId, "skill-gap");
    if (!limit.allowed) {
      throw new Error(`Limit reached. Resets in ${formatResetTime(limit.resetAt)}.`);
    }

    const validation = validateInput(skillGapAnalysisSchema, data);
    if (!validation.success) return { success: false, errors: validation.errors };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

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
      outputRules: `Output ONLY a valid JSON object matching exactly this schema, without markdown code fences or extra text:
{
  "matchPercentage": 75,
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": [
    { "skill": "Missing Skill", "priority": "High" }
  ],
  "weeklyRoadmap": [
    { "week": "Week 1", "focus": "Topic", "tasks": ["Task 1", "Task 2"] }
  ],
  "suggestedProjects": [
    { "name": "Project Name", "description": "Desc", "skillsPracticed": ["Skill"] }
  ],
  "interviewFocus": ["Topic 1"]
}`,
    });

    const aiResult = await generateGeminiContent(prompt);
    let rawText = aiResult.response.text();
    // Clean up potential markdown formatting
    if (rawText.startsWith('```json')) rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    if (rawText.startsWith('```')) rawText = rawText.replace(/```/g, '').trim();

    let analysisJson;
    try {
      analysisJson = JSON.parse(rawText);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }

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
