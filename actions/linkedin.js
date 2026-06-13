"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput, parseAIJson } from "@/lib/validate";
import { linkedInOptimizationSchema } from "@/lib/schemas/forms";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function optimizeLinkedInProfile(data) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const limit = await checkRateLimit(userId, "linkedin");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`LinkedIn optimization limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const validation = validateInput(linkedInOptimizationSchema, data);
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: "You are an expert LinkedIn profile optimizer and technical recruiter. Analyze the provided LinkedIn profile content and suggest improvements to maximize search visibility and recruiter engagement.",
    untrustedData: [
      { label: "profileContent", value: validation.data.profileContent, maxLength: 50000 },
    ],
    outputRules: `Provide your analysis in the following JSON format ONLY:
{
  "headlineSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "summaryImprovements": "A detailed paragraph explaining how to improve the 'About' section.",
  "experienceFeedback": [
    {
      "role": "Current/Past Role Title",
      "feedback": "Specific feedback on how to rewrite the bullet points to be more impactful (e.g., add metrics)."
    }
  ],
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "overallScore": 85
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.linkedInOptimization.create({
      data: {
        userId: user.id,
        profileContent: validation.data.profileContent,
        analysis: parsedData,
      },
    });

    revalidatePath("/linkedin-optimizer");
    return { success: true, data: record };
  } catch (error) {
    console.error("LinkedIn Optimization Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate optimization"] } };
  }
}

export async function getLinkedInOptimizations() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.linkedInOptimization.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
