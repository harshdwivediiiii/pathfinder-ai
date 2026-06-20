"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateWithStructuredOutput, buildSecurePrompt } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateInput, validateOutput } from "@/lib/validate";
import { bulletRewriterSchema, bulletRewriterOutputSchema } from "@/lib/schemas/forms";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { assertFeatureEnabled } from "@/lib/ai-gating";
import { generateGeminiContent } from "@/lib/gemini";

export async function rewriteBullet(rawParams) {
  try {
    assertFeatureEnabled("bulletRewriter");
  } catch (err) {
    return { success: false, errors: { _form: [err.message] } };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, errors: { _form: ["Sign-in required to use the Bullet Rewriter."] } };
  }

  const validation = validateInput(bulletRewriterSchema, rawParams);
  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  const limit = await checkRateLimit(userId, "bulletRewriter");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Bullet Rewriter limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const { bulletText, targetRole } = validation.data;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) {
    return { success: false, errors: { _form: ["Active database profile not found."] } };
  }

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: `As an expert resume writer, rewrite the following resume bullet point to make it more impactful, quantifiable, and ATS-friendly.

Requirements:
1. Use the Action -> Task -> Result framework.
2. Start with strong action verbs (e.g., Led, Achieved, Increased, Reduced, Spearheaded).
3. Include quantifiable metrics and outcomes if implied or plausible, but keep them realistic.
4. Use ATS-friendly language and a highly professional tone.
5. Provide 2-3 alternative rewrites.
6. Provide a brief explanation for why each rewrite is effective.
7. Incorporate the target role context if provided.

Respond ONLY with a valid JSON object in this exact format:
{
  "rewrites": [
    {
      "bullet": "<string: the improved bullet text>",
      "explanation": "<string: brief explanation of why this is better>"
    }
  ]
}`,
    untrustedData: [
      { label: "bulletText", value: bulletText, maxLength: 600 },
      { label: "targetRole", value: targetRole || "", maxLength: 150 },
    ],
  });

  const schemaDescription = `{
  "rewrites": [
    {
      "bullet": "string",
      "explanation": "string"
    }
  ]
}`;

  try {
    const result = await generateWithStructuredOutput({
      prompt,
      schemaDescription,
      schema: bulletRewriterOutputSchema,
      generateFn: async (p) => {
        const raw = await generateGeminiContent(p);
        return raw.response.text().trim();
      },
      validateFn: validateOutput,
    });

    if (!result.success) {
      console.error("Output validation failed:", result.errors);
      return { success: false, errors: { _form: ["AI returned an unexpected format. Please try again."] } };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error rewriting bullet:", error);
    return { success: false, errors: { _form: ["An unexpected error occurred while rewriting your bullet. Please try again later."] } };
  }
}
