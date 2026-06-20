"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isFeatureEnabled } from "@/lib/ai-gating";
import { ATS_ANALYSIS_CACHE_TTL_MS, cachedGenerateGeminiContent, generateCacheKey } from "@/lib/cache";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateInput, validateOutput, parseAIJson } from "@/lib/validate";
import { atsAnalysisSchema } from "@/lib/schemas/forms";
import { atsAnalysisOutputSchema } from "@/lib/schemas";
import { normalizeAtsSuggestions } from "@/lib/ats";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { USER_NOT_FOUND_MESSAGE } from "@/lib/errors";

/**
 * Runs an ATS analysis using Gemini AI and persists the result safely.
 */
export async function analyzeATS(rawParams) {
  try {
    if (!isFeatureEnabled("ats")) {
      return { success: false, errors: { _form: ["ATS analysis feature is currently disabled (missing configuration)."] } };
    }

    const { userId } = await auth();

    if (!userId) {
      return { success: false, errors: { _form: ["Sign-in required to scan applications."] } };
    }

    const limit = await checkRateLimit(userId, "ats");
    if (!limit.allowed) {
      return {
        success: false,
        errors: {
          _form: [`ATS analysis limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
        },
      };
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
      return { success: false, errors: { _form: [USER_NOT_FOUND_MESSAGE] } };
    }

    const prompt = buildSecurePrompt({
      context: buildUserProfileContext(user),
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
  "highlights": [
    {
      "type": "weak_impact",
      "text": "exact sentence or phrase from the resumeContent that is weak, passive, or generic",
      "suggestion": "specific coaching/rephrasing advice (e.g. use action verbs, quantify results)"
    },
    {
      "type": "keyword_insertion",
      "text": "exact heading or line from the resumeContent where missing technical keywords should logically be added",
      "suggestion": "list of missing keywords and explanation of how to weave them in"
    }
  ],
  "overallFeedback": "string highlighting strengths and gaps"
}

Scoring guidelines:
- 0-40: Poor match
- 41-60: Fair match
- 61-75: Good match
- 76-90: Strong match
- 91-100: Excellent match

Be specific and actionable. Include at least 5 matched keywords (if present), at least 5 missing keywords, at least 5 improvement suggestions, and at least 3 to 6 highlights mapping to exact parts of the resumeContent.
IMPORTANT: Return ONLY valid JSON. No markdown, no explanation outside the JSON.`,
    });

    const result = await cachedGenerateGeminiContent(prompt, {}, {
      key: generateCacheKey("ats", user.id, buildUserProfileContext(user), resumeContent, jobDescription),
      ttl: ATS_ANALYSIS_CACHE_TTL_MS,
    });
    const parsedAnalysis = parseAIJson(result.response.text());
    const cacheKey = generateCacheKey(
      "ats",
      resumeContent,
      jobDescription,
      jobTitle,
      companyName
    );

    const result = await cachedGenerateGeminiContent(
      prompt,
      {},
      {
        key: cacheKey,
        ttl: ATS_ANALYSIS_CACHE_TTL_MS,
      }
    );
    const outputValidation = validateOutput(atsAnalysisOutputSchema, result.response.text());
    if (!outputValidation.success) {
      console.error("ATS analysis output validation failed:", outputValidation.errors);
      return { success: false, errors: { _form: ["AI returned an unexpected format. Please try again."] } };
    }
    const parsedAnalysis = outputValidation.data;

    const matchedKeywords = Array.isArray(parsedAnalysis.matchedKeywords) ? parsedAnalysis.matchedKeywords.map(String) : [];
    const missingKeywords = Array.isArray(parsedAnalysis.missingKeywords) ? parsedAnalysis.missingKeywords.map(String) : [];
    
    const rawSuggestions = Array.isArray(parsedAnalysis.suggestions) ? parsedAnalysis.suggestions : [];
    const rawHighlights = Array.isArray(parsedAnalysis.highlights) ? parsedAnalysis.highlights : [];
    const highlightSuggestions = rawHighlights.map(h => ({
      category: "highlight",
      type: h.type || "weak_impact",
      text: h.text || "",
      tip: h.suggestion || h.tip || ""
    })).filter(h => h.text.trim().length > 0);

    const suggestions = normalizeAtsSuggestions([...rawSuggestions, ...highlightSuggestions]);

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
      return { success: false, errors: { _form: [USER_NOT_FOUND_MESSAGE] } };
    }

    const { count } = await db.atsAnalysis.deleteMany({
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

    revalidatePath("/ats-analyzer");
    return { success: true };
  } catch (error) {
    console.error("Failed to safely delete ATS entry:", error);
    return { success: false, errors: { _form: [error.message || String(error)] } };
  }
}
