"use server";
import { auth } from "@clerk/nextjs/server";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { parseAIJson } from "@/lib/validate";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function rewriteResumeBullet(bulletText, roleContext = "") {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Sign-in required."] } };

  if (!bulletText || bulletText.trim().length < 10) {
    return { success: false, errors: { _form: ["Please enter a resume bullet point."] } };
  }

  const limit = await checkRateLimit(userId, "resume-roast");
  if (!limit.allowed) {
    return {
      success: false,
      errors: { _form: [`Bullet rewriter limit reached. Resets in ${formatResetTime(limit.resetAt)}.`] },
    };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert resume coach and career strategist who specializes in writing achievement-oriented resume bullets that pass ATS systems and impress hiring managers.",
    task: `Rewrite the provided resume bullet point into 3 stronger alternatives using the Action → Task → Result framework. Each rewrite should start with a powerful action verb, emphasize measurable outcomes, and be ATS-friendly.`,
    untrustedData: [
      { label: "bulletPoint", value: bulletText, maxLength: 500 },
      { label: "roleContext", value: roleContext || "Not specified", maxLength: 200 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "rewrites": [
    {
      "bullet": "Rewritten bullet point 1",
      "explanation": "Why this version is stronger"
    },
    {
      "bullet": "Rewritten bullet point 2",
      "explanation": "Why this version is stronger"
    },
    {
      "bullet": "Rewritten bullet point 3",
      "explanation": "Why this version is stronger"
    }
  ],
  "tips": ["Quick tip 1", "Quick tip 2"]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const rawText = aiResult.response.text();
    const parsedData = parseAIJson(rawText);
    return { success: true, data: parsedData };
  } catch (error) {
    console.error("Bullet Rewriter Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to rewrite bullet"] } };
  }
}