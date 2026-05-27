"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { validateInput } from "@/lib/validate";
import { atsAnalysisSchema } from "@/lib/schemas/forms";
import { normalizeAtsSuggestions } from "@/lib/ats";

/**
 * Runs an ATS analysis using Gemini AI and persists the result safely.
 */
export async function analyzeATS(rawParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, errors: { _form: ["Sign-in required to scan applications."] } };
    }

    const validation = validateInput(atsAnalysisSchema, rawParams);
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
      task: "You are an expert ATS (Applicant Tracking System) analyst and career coach. Analyze the resume against the job description and return a detailed ATS compatibility report.",
      untrustedData: [
        { label: "resumeContent", value: resumeContent, maxLength: 8000 },
        { label: "jobDescription", value: jobDescription, maxLength: 8000 },
        { label: "jobTitle", value: jobTitle || "Not specified", maxLength: 200 },
        { label: "companyName", value: companyName || "Not specified", maxLength: 200 },
      ],
      outputRules: `Provide your analysis in the following JSON format ONLY - no extra text, no markdown fences:
{
  "atsScore": <number between 0 and 100>,
  "matchedKeywords": [<array of keywords found in both>],
  "missingKeywords": [<array of key missing keywords>],
  "suggestions": [
    { "category": "Keywords", "tip": "Add missing technical terms from the job description" }
  ],
  "overallFeedback": "string highlighting strengths and gaps"
}

Scoring guidelines:
- 0-40: Poor match
- 41-60: Fair match
- 61-75: Good match
- 76-90: Strong match
- 91-100: Excellent match

Be specific and actionable. Include at least 5 matched keywords (if present), at least 5 missing keywords, and at least 5 improvement suggestions.
IMPORTANT: Return ONLY valid JSON. No markdown, no explanation outside the JSON.`,
    });

    const result = await generateGeminiContent(prompt);
    const text = result.response.text().trim();

    const cleanJsonText = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const parsedAnalysis = JSON.parse(cleanJsonText);

    const matchedKeywords = Array.isArray(parsedAnalysis.matchedKeywords) ? parsedAnalysis.matchedKeywords.map(String) : [];
    const missingKeywords = Array.isArray(parsedAnalysis.missingKeywords) ? parsedAnalysis.missingKeywords.map(String) : [];
    const suggestions = normalizeAtsSuggestions(parsedAnalysis.suggestions);

    const record = await db.atsAnalysis.create({
      data: {
        userId: user.id,
        jobTitle: jobTitle || "Target Position",
        companyName: companyName || "Target Company",
        jobDescription,
        resumeContent,
        atsScore: Math.min(100, Math.max(0, parsedAnalysis.atsScore || 0)),
        matchedKeywords,
        missingKeywords,
        suggestions,
        overallFeedback: parsedAnalysis.overallFeedback || null,
      },
    });

    revalidatePath("/ats-analyzer");
    return { success: true, data: record };
  } catch (error) {
    console.error("[ATS Action Error]:", error);
    return { success: false, errors: { _form: [error.message || String(error)] } };
  }
}

/**
 * Fetches all ATS analyses for the signed-in user, newest first.
 */
export async function getATSAnalyses() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, data: [] };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      return { success: false, data: [] };
    }

    const analyses = await db.atsAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: analyses || [] };
  } catch (error) {
    console.error("Failed to query ATS listings:", error);
    return { success: false, data: [] };
  }
}

/**
 * Deletes a specific ATS analysis record with strict ownership validation.
 */
export async function deleteATSAnalysis(id) {
  try {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return { success: false, errors: { _form: ["Invalid analysis identifier format provided."] } };
    }

    const { userId } = await auth();
    if (!userId) {
      return { success: false, errors: { _form: ["Unauthorized access."] } };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) {
      return { success: false, errors: { _form: ["User profile not found."] } };
    }

    // Ensure the record exists and belongs to the requesting user before deleting.
    const existing = await db.atsAnalysis.findUnique({ where: { id: id.trim() } });
    if (!existing) {
      return { success: false, errors: { _form: ["Analysis record not found."] } };
    }

    if (existing.userId !== user.id) {
      return { success: false, errors: { _form: ["Unauthorized: you do not own this analysis."] } };
    }

    await db.atsAnalysis.deleteMany({
      where: {
        id: existing.id,
        userId: user.id,
      },
    });

    revalidatePath("/ats-analyzer");
    return { success: true };
  } catch (error) {
    console.error("Failed to safely delete ATS entry:", error);
    return { success: false, errors: { _form: [error.message || String(error)] } };
  }
}
