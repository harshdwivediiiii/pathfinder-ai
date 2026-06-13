"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt, generateWithStructuredOutput } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateInput, validateOutput } from "@/lib/validate";
import { coverLetterInputSchema } from "@/lib/schemas/forms";
import { coverLetterOutputSchema, SCHEMA_DESCRIPTIONS } from "@/lib/schemas/outputs";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

/**
 * Generates a professional cover letter using Gemini AI with structured output validation.
 * Falls back to a safe template if AI generation or validation fails.
 */
export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const limit = await checkRateLimit(userId, "coverLetter");
  if (!limit.allowed) {
    throw new Error(`Cover letter limit reached. Resets in ${formatResetTime(limit.resetAt)}.`);
  }

  const validation = validateInput(coverLetterInputSchema, data);
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const { jobTitle, companyName, jobDescription } = validation.data;

  const prompt = buildSecurePrompt({
    context: `${buildUserProfileContext(user)}\n\nYou are a professional career coach and cover letter writer.`,
    task: `Write a professional cover letter for the position described below.

Use only the candidate facts provided in the input. Do not invent projects, achievements,
titles, certifications, metrics, or years of experience that are not explicitly provided.
If a detail is missing, keep the wording general instead of guessing.

Respond ONLY with a valid JSON object in this exact format (no markdown, no code fences):
{
  "greeting": "Dear Hiring Manager,",
  "body": "<2-3 paragraphs, professional tone, max 300 words>",
  "closing": "Sincerely,\\n<candidate name>"
}`,
    untrustedData: [
      { label: "jobTitle", value: data.jobTitle, maxLength: 200 },
      { label: "companyName", value: data.companyName, maxLength: 200 },
      { label: "jobDescription", value: data.jobDescription, maxLength: 8000 },
      { label: "jobTitle", value: jobTitle, maxLength: 200 },
      { label: "companyName", value: companyName, maxLength: 200 },
      { label: "candidateName", value: user.name || "Candidate", maxLength: 200 },
      { label: "industry", value: user.industry || "Technology", maxLength: 200 },
      { label: "experience", value: String(user.experience || "0") + " years", maxLength: 100 },
      { label: "skills", value: user.skills?.join(", ") || "Not specified", maxLength: 1000 },
      { label: "bio", value: user.bio || "Not specified", maxLength: 2000 },
      { label: "jobDescription", value: jobDescription, maxLength: 8000 },
    ],
  });

  const schemaDescription = SCHEMA_DESCRIPTIONS.coverLetter;

  try {
    const result = await generateWithStructuredOutput({
      prompt,
      schemaDescription,
      schema: coverLetterOutputSchema,
      generateFn: async (p) => {
        const raw = await generateGeminiContent(p);
        return raw.response.text().trim();
      },
      validateFn: validateOutput,
    });

    if (!result.success) {
      console.error("Cover letter output validation failed:", result.errors);
      throw new Error("AI returned an unexpected format.");
    }

    // Reassemble sections into a single markdown string for backward compatibility
    const { greeting, body, closing } = result.data;
    const content = `${greeting}\n\n${body}\n\n${closing}`;

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        companyName,
        jobTitle,
        jobDescription,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error(error?.message || "Failed to generate your cover letter. Please check your AI configuration.");
  }
}

/**
 * Fetches all cover letters for the signed-in user, newest first.
 */
export async function getCoverLetters() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return [];

    return db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching cover letters:", error);
    return [];
  }
}

/**
 * Fetches a single cover letter by ID (ownership-checked).
 */
export async function getCoverLetter(id) {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return null;

    return db.coverLetter.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Error fetching cover letter:", error);
    return null;
  }
}

/**
 *Deletes a specific cover letter record with strict ownership validation.
 */
export async function deleteCoverLetter(id) {
  try {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return { success: false, errors: { _form: ["Invalid cover letter identifier."] } };
    }

    const { userId } = await auth();
    if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return { success: false, errors: { _form: ["User not found"] } };

    const { count } = await db.coverLetter.deleteMany({
      where: {
        id: id.trim(),
        userId: user.id,
      },
    });

    if (count === 0) {
      return { success: false, errors: { _form: ["Cover letter not found or already deleted."] } };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete cover letter:", error);
    return { success: false, errors: { _form: [error.message || String(error)] } };
  }
}
