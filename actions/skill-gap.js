"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function generateSkillGapAnalysis(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const limit = await checkRateLimit(userId, "skill-gap");
    if (!limit.allowed) {
      throw new Error(`Limit reached. Resets in ${formatResetTime(limit.resetAt)}.`);
    }

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
    
    const analysisJson = JSON.parse(rawText);

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
    console.error("Error generating skill gap analysis:", error);
    return { data: null, error: error.message || "Failed to generate analysis" };
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
    console.error("Error fetching skill gap analysis:", error);
    return { data: null, error: error.message };
  }
}
