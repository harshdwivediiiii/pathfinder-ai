"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt, generateWithStructuredOutput } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateOutput } from "@/lib/validate";
import { founderReadinessOutputSchema, SCHEMA_DESCRIPTIONS } from "@/lib/schemas/outputs";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

const FOUNDER_SYSTEM_CONTEXT = `You are a top-tier venture capital partner and startup advisor. Your expertise is evaluating early-stage founders and giving blunt, actionable, and highly constructive feedback on their readiness to launch a startup. You identify blind spots, score their founder-market fit, and provide a 90-day transition roadmap.`;

export async function generateFounderReadiness(formData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const limit = await checkRateLimit(userId, "founder_readiness");
    if (!limit.allowed) {
      throw new Error(`Founder readiness generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`);
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const businessIdea = formData.get("businessIdea");
    const riskTolerance = formData.get("riskTolerance");
    const skills = formData.get("skills");

    const prompt = buildSecurePrompt({
      context: `${buildUserProfileContext(user)}\n\n${FOUNDER_SYSTEM_CONTEXT}`,
      task: `Analyze the user's readiness to become a startup founder based on their profile and the following inputs:
Business Idea/Space: "${businessIdea}"
Risk Tolerance: "${riskTolerance}"
Self-Assessed Core Skills: "${skills}"

Provide a "Founder Score" (0-100), key strengths, critical blind spots with mitigation strategies, feedback on their business idea, and a 3-phase (Month 1, Month 2, Month 3) 90-day transition roadmap.

Respond ONLY with a valid JSON object in this exact format:
{
  "founderScore": 85,
  "strengths": ["Strength 1", "Strength 2"],
  "blindSpots": [
    {
      "issue": "Specific blind spot",
      "mitigation": "How to mitigate it (e.g., hire a co-founder with X skill)"
    }
  ],
  "businessIdeaFeedback": "Brutal but constructive feedback on the idea",
  "ninetyDayRoadmap": [
    {
      "phase": "Month 1: Validation",
      "actionItems": ["Action 1", "Action 2"]
    }
  ]
}`,
      untrustedData: [
        { label: "businessIdea", value: businessIdea, maxLength: 1000 },
        { label: "riskTolerance", value: riskTolerance, maxLength: 100 },
        { label: "skills", value: skills, maxLength: 1000 },
      ],
    });

    const schemaDescription = SCHEMA_DESCRIPTIONS.founderReadiness;

    const result = await generateWithStructuredOutput({
      prompt,
      schemaDescription,
      schema: founderReadinessOutputSchema,
      generateFn: async (p) => {
        const raw = await generateGeminiContent(p);
        return raw.response.text().trim();
      },
      validateFn: validateOutput,
    });

    if (!result.success) {
      console.error("Founder readiness output validation failed:", result.errors);
      throw new Error("AI returned an unexpected format.");
    }

    const readiness = await db.founderReadiness.create({
      data: {
        userId: user.id,
        businessIdea,
        riskTolerance,
        skills,
        readinessData: result.data,
      },
    });

    return readiness;
  } catch (error) {
    console.error("Error generating founder readiness:", error);
    if (process.env.NODE_ENV === "test") {
      throw error;
    }
    return {
      success: false,
      error: error?.message || "Failed to generate founder readiness analysis."
    };
  }
}

export async function getFounderReadinesses() {
  try {
    const { userId } = await auth();
    if (!userId) return { readinesses: [], error: null };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return { readinesses: [], error: null };

    const readinesses = await db.founderReadiness.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    
    return { readinesses, error: null };
  } catch (error) {
    console.error("Error fetching founder readinesses:", error);
    return { 
      readinesses: [], 
      error: error.message || "Failed to load founder readiness history." 
    };
  }
}
