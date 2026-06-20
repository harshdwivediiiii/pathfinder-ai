"use server";
import { USER_NOT_FOUND_MESSAGE } from "@/lib/errors";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { cachedGenerateGeminiContent, RESUME_IMPROVEMENT_CACHE_TTL_MS, generateCacheKey } from "@/lib/cache";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt, generateWithStructuredOutput } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateInput, validateOutput } from "@/lib/validate";
import { resumeSaveSchema, resumeImprovementSchema } from "@/lib/schemas/forms";
import { resumeImprovementOutputSchema, SCHEMA_DESCRIPTIONS } from "@/lib/schemas/outputs";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function saveResume(rawContent) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Sign-in required to update resume files."] } };

  const validation = validateInput(resumeSaveSchema, { content: rawContent });
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: [USER_NOT_FOUND_MESSAGE] } };

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content: validation.data.content,
      },
      create: {
        userId: user.id,
        content: validation.data.content,
      },
    });

    revalidatePath("/resume");
    return { success: true, data: resume };
  } catch (error) {
    console.error("Error saving resume content:", error);
    return { success: false, errors: { _form: ["Failed to update resume storage transaction record."] } };
  }
}

export async function getResume() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return null;

    return await db.resume.findUnique({
      where: {
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return null;
  }
}

export async function improveWithAI(rawParams) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Sign-in expired. Please authenticate again."] } };

  const limit = await checkRateLimit(userId, "resume");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Resume improvement limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const validation = validateInput(resumeImprovementSchema, rawParams);
  if (!validation.success) return { success: false, errors: validation.errors };

  const { current, type } = validation.data;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });
  if (!user) return { success: false, errors: { _form: ["User account match could not be checked."] } };

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: `As an expert resume writer, improve the following description to make it more impactful, quantifiable, and aligned with industry standards.

Requirements:
1. Use action verbs
2. Include metrics and results only when supported by the source text
3. Highlight relevant technical skills
4. Keep it concise but detailed
5. Focus on achievements over responsibilities
6. Use industry-specific keywords
7. Do not invent employers, dates, tools, certifications, metrics, or outcomes

Respond ONLY with a valid JSON object in this exact format (no markdown, no code fences):
{
  "improvedContent": "<single improved paragraph>",
  "highlights": ["<key achievement 1>", "<key achievement 2>", ...]
}`,
    untrustedData: [
      { label: "resumeContent", value: current, maxLength: 8000 },
      { label: "type", value: type, maxLength: 200 },
    ],
  });

  const schemaDescription = SCHEMA_DESCRIPTIONS.resumeImprovement;

  try {
    const result = await generateWithStructuredOutput({
      prompt,
      schemaDescription,
      schema: resumeImprovementOutputSchema,
      generateFn: async (p) => {
        const raw = p === prompt
          ? await cachedGenerateGeminiContent(p, {}, {
              key: generateCacheKey("improve", user.id, buildUserProfileContext(user), current, type),
              key: generateCacheKey("improve", userId, current, type, user.industry),
              ttl: RESUME_IMPROVEMENT_CACHE_TTL_MS,
            })
          : await generateGeminiContent(p);
        return raw.response.text().trim();
      },
      validateFn: validateOutput,
    });

    if (!result.success) {
      console.error("Output validation failed:", result.errors);
      return { success: false, errors: { _form: ["AI returned an unexpected format. Please try again."] } };
    }

    // Reassemble into plain string for backward compatibility with existing DB/UI
    const highlightsText = result.data.highlights && result.data.highlights.length > 0
      ? "\n\n" + result.data.highlights.map((h) => `- ${h}`).join("\n")
      : "";
    const improvedText = `${result.data.improvedContent}${highlightsText}`;
    return { success: true, data: improvedText };
  } catch (error) {
    console.error("Error optimizing structural field elements:", error);
    return { success: false, errors: { _form: [error?.message || "AI pipeline configuration encountered an error."] } };
  }
}
