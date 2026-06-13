"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt, generateWithStructuredOutput } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateOutput } from "@/lib/validate";
import { careerRoadmapOutputSchema, SCHEMA_DESCRIPTIONS } from "@/lib/schemas/outputs";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

const ROADMAP_SYSTEM_CONTEXT = `You are a senior career strategist and technical mentor. Your expertise is creating personalized, actionable career roadmaps that break down long-term goals into concrete milestones. Each milestone should be a stepping stone that builds on the previous one, with clear skills to develop and a realistic time frame.`;

/**
 * Generates a personalized career roadmap using Gemini AI with structured output validation.
 * Builds the roadmap from the user's existing profile (skills, goals, target role, industry).
 */
export async function generateCareerRoadmap() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const limit = await checkRateLimit(userId, "roadmap");
  if (!limit.allowed) {
    throw new Error(`Roadmap generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`);
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const prompt = buildSecurePrompt({
    context: `${buildUserProfileContext(user)}\n\n${ROADMAP_SYSTEM_CONTEXT}`,
    task: `Create a personalized career roadmap based on the user's profile above.

The roadmap should include 6-12 milestones that progressively build toward the user's target role.
Each milestone must include specific skills to learn, a realistic duration, and a priority level.

Respond ONLY with a valid JSON object in this exact format (no markdown, no code fences):
{
  "milestones": [
    {
      "title": "Milestone title (3-100 chars)",
      "description": "What this milestone involves (10-500 chars)",
      "skillsToLearn": ["skill1", "skill2"],
      "estimatedDuration": "e.g. 3-6 months",
      "priority": "high|medium|low"
    }
  ],
  "totalEstimatedTime": "Overall timeline estimate",
  "summary": "Brief summary of the roadmap"
}`,
    untrustedData: [
      { label: "industry", value: user.industry || "Not specified", maxLength: 200 },
      { label: "currentRole", value: user.currentRole || "Not specified", maxLength: 200 },
      { label: "targetRole", value: user.targetRole || "Not specified", maxLength: 200 },
      { label: "careerGoals", value: user.careerGoals || "Not specified", maxLength: 1000 },
      { label: "experience", value: String(user.experience || "0") + " years", maxLength: 100 },
      { label: "skills", value: user.skills?.join(", ") || "Not specified", maxLength: 1000 },
      { label: "bio", value: user.bio || "Not specified", maxLength: 2000 },
    ],
  });

  const schemaDescription = SCHEMA_DESCRIPTIONS.careerRoadmap;

  try {
    const result = await generateWithStructuredOutput({
      prompt,
      schemaDescription,
      schema: careerRoadmapOutputSchema,
      generateFn: async (p) => {
        const raw = await generateGeminiContent(p);
        return raw.response.text().trim();
      },
      validateFn: validateOutput,
    });

    if (!result.success) {
      console.error("Career roadmap output validation failed:", result.errors);
      throw new Error("AI returned an unexpected format.");
    }

    // Upsert — each user has at most one roadmap
    const roadmap = await db.roadmap.upsert({
      where: { userId: user.id },
      create: {
        content: result.data,
        userId: user.id,
      },
      update: {
        content: result.data,
      },
    });

    return roadmap;
  } catch (error) {
    console.error("Error generating career roadmap:", error);
    throw new Error(error?.message || "Failed to generate your career roadmap. Please check your AI configuration.");
  }
}

/**
 * Fetches the signed-in user's saved roadmap.
 * Returns an object with { roadmap, error } for proper error handling.
 */
export async function getRoadmap() {
  try {
    const { userId } = await auth();
    if (!userId) return { roadmap: null, error: null };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return { roadmap: null, error: null };

    const roadmap = await db.roadmap.findUnique({
      where: { userId: user.id },
    });
    
    return { roadmap: roadmap || null, error: null };
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return { 
      roadmap: null, 
      error: error.message || "Failed to load roadmap. Please try again." 
    };
  }
}