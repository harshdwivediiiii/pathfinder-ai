"use server";
import { auth } from "@clerk/nextjs/server";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { parseAIJson } from "@/lib/validate";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function rewriteResumeBullet(bulletText, roleContext = "") {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Sign-in required."] } };

  if (typeof bulletText !== "string" || bulletText.trim().length < 10) {
    return { success: false, errors: { _form: ["Please enter a resume bullet point (min 10 characters)."] } };
  }
  if (bulletText.trim().length > 500) {
    return { success: false, errors: { _form: ["Bullet point must be under 500 characters."] } };
  }
  if (typeof roleContext !== "string") roleContext = "";
  if (roleContext.length > 200) roleContext = roleContext.slice(0, 200);

  const limit = await checkRateLimit(userId, "bullet-rewriter");
  if (!limit.allowed) {
    return {
      success: false,
      errors: { _form: [`Bullet rewriter limit reached. Resets in ${formatResetTime(limit.resetAt)}.`] },
    };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert resume coach and career strategist who specializes in writing achievement-oriented resume bullets that pass ATS systems and impress hiring managers.",
    task: "Rewrite the provided resume bullet point into 3 stronger alternatives using the Action to Task to Result framework. Each rewrite should start with a powerful action verb, emphasize measurable outcomes using only facts provided by the user (use bracketed placeholders like [X%] or [N users] if metrics are missing), and be ATS-friendly. Do not fabricate specific metrics.",
    untrustedData: [
      { label: "bulletPoint", value: bulletText.trim(), maxLength: 500 },
      { label: "roleContext", value: roleContext.trim() || "Not specified", maxLength: 200 },
    ],
    outputRules: "Provide the output in the following JSON format ONLY:\n{\n  \"rewrites\": [\n    { \"bullet\": \"Rewritten bullet 1\", \"explanation\": \"Why this is stronger\" },\n    { \"bullet\": \"Rewritten bullet 2\", \"explanation\": \"Why this is stronger\" },\n    { \"bullet\": \"Rewritten bullet 3\", \"explanation\": \"Why this is stronger\" }\n  ],\n  \"tips\": [\"Quick tip 1\", \"Quick tip 2\"]\n}",
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const rawText = aiResult.response.text();
    const parsedData = parseAIJson(rawText);
    if (!Array.isArray(parsedData?.rewrites) || parsedData.rewrites.length === 0) {
      throw new Error("Unexpected AI response format.");
    }
    return { success: true, data: parsedData };
  } catch (error) {
    console.error("Bullet Rewriter Error:", error);
    return { success: false, errors: { _form: ["Failed to rewrite bullet. Please try again."] } };
  }
}
