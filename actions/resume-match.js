"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateInput, parseAIJson } from "@/lib/validate";
import { resumeMatchSchema } from "@/lib/schemas/forms";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { generateGeminiContent } from "@/lib/gemini";

/**
 * Helper to get the user ID, falling back to a dummy user for local development
 * if auth is bypassed.
 */
async function getAuthenticatedUserId() {
  const { userId } = await auth();
  if (userId) return userId;

  // Fallback for local testing when auth is bypassed
  if (process.env.NODE_ENV === "development") {
    console.warn("Auth bypassed, using fallback user for local development");
    return "dummy_user_123";
  }
  
  return null;
}

export async function analyzeResumeMatch(rawParams) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return { success: false, errors: { _form: ["Sign-in required to analyze resume match."] } };
    }

    const limit = await checkRateLimit(userId, "resume-match");
    if (!limit.allowed) {
      return {
        success: false,
        errors: {
          _form: [`Resume match limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
        },
      };
    }

    const validation = validateInput(resumeMatchSchema, rawParams);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    const { resumeContent, jobDescription, jobTitle, companyName } = validation.data;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    
    if (!user) {
      return { success: false, errors: { _form: ["Active user account not found."] } };
    }

    const prompt = buildSecurePrompt({
      context: buildUserProfileContext(user),
      task: "You are an expert technical recruiter and career coach. Analyze the provided resume against the provided job description and return a detailed resume-job match analysis report.",
      untrustedData: [
        { label: "resumeContent", value: resumeContent, maxLength: 8000 },
        { label: "jobDescription", value: jobDescription, maxLength: 8000 },
        { label: "jobTitle", value: jobTitle || "Not specified", maxLength: 200 },
        { label: "companyName", value: companyName || "Not specified", maxLength: 200 },
      ],
      outputRules: `Provide your analysis in the following JSON format ONLY - no extra text, no markdown fences:
{
  "matchScore": <number between 0 and 100>,
  "matchedKeywords": [<array of keywords found in both>],
  "missingKeywords": [<array of key missing keywords>],
  "sectionFeedback": {
    "skills": { "score": <0-100>, "feedback": "...", "suggestions": "..." },
    "experience": { "score": <0-100>, "feedback": "...", "suggestions": "..." },
    "projects": { "score": <0-100>, "feedback": "...", "suggestions": "..." },
    "education": { "score": <0-100>, "feedback": "...", "suggestions": "..." }
  },
  "suggestions": [
    "string suggestion 1",
    "string suggestion 2"
  ],
  "improvedBulletPoints": [
    {
      "original": "exact sentence or phrase from the resumeContent that is weak",
      "improved": "the rewritten bullet point that is stronger and uses keywords"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation outside the JSON.`,
    });

    const result = await generateGeminiContent(prompt);
    const parsedAnalysis = parseAIJson(result.response.text());

    const record = await db.resumeMatchAnalysis.create({
      data: {
        userId: user.id,
        jobTitle: jobTitle || null,
        companyName: companyName || null,
        jobDescription,
        resumeContent,
        matchScore: Math.min(100, Math.max(0, Number(parsedAnalysis.matchScore) || 0)),
        matchedKeywords: Array.isArray(parsedAnalysis.matchedKeywords) ? parsedAnalysis.matchedKeywords.map(String) : [],
        missingKeywords: Array.isArray(parsedAnalysis.missingKeywords) ? parsedAnalysis.missingKeywords.map(String) : [],
        sectionFeedback: parsedAnalysis.sectionFeedback || {},
        suggestions: Array.isArray(parsedAnalysis.suggestions) ? parsedAnalysis.suggestions : [],
        improvedBulletPoints: Array.isArray(parsedAnalysis.improvedBulletPoints) ? parsedAnalysis.improvedBulletPoints : [],
      },
    });

    revalidatePath("/resume-match");
    return { success: true, data: record };
  } catch (error) {
    console.error("[Resume Match Action Error]:", error);
    return { success: false, errors: { _form: ["An error occurred processing your request"] } };
  }
}

export async function getResumeMatchHistory() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, data: [] };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      return { success: false, data: [] };
    }

    const analyses = await db.resumeMatchAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        matchScore: true,
        matchedKeywords: true,
        missingKeywords: true,
        sectionFeedback: true,
        suggestions: true,
        improvedBulletPoints: true,
        createdAt: true,
      }
    });
    return { success: true, data: analyses || [] };
  } catch (error) {
    console.error("Failed to query resume match history:", error);
    return { success: false, data: [] };
  }
}

export async function deleteResumeMatchAnalysis(id) {
  try {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return { success: false, errors: { _form: ["Invalid analysis identifier format provided."] } };
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, errors: { _form: ["Unauthorized access."] } };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      return { success: false, errors: { _form: ["User profile not found."] } };
    }

    const { count } = await db.resumeMatchAnalysis.deleteMany({
      where: {
        id: id.trim(),
        userId: user.id,
      },
    });

    if (count === 0) {
      return {
        success: false,
        errors: {
          _form: ["Analysis record not found."],
        },
      };
    }

    revalidatePath("/resume-match");
    return { success: true };
  } catch (error) {
    console.error("Failed to safely delete resume match entry:", error);
    return { success: false, errors: { _form: ["An error occurred processing your request"] } };
  }
}
