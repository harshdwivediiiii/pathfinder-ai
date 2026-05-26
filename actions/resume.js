"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateGeminiStructuredContent } from "@/lib/gemini";
import { buildSecurePrompt, resumeBulletsOutputSchema } from "@/lib/prompt-safety";
import { validateInput } from "@/lib/validate";
import { resumeSaveSchema, resumeImprovementSchema } from "@/lib/schemas/forms";

export async function saveResume(rawContent) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Sign-in required to update resume files."] } };

  const validation = validateInput(resumeSaveSchema, { content: rawContent });
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["Active database profile not found."] } };

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
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });
}

export async function improveWithAI(rawParams) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Sign-in expired. Please authenticate again."] } };

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
    task: "As an expert resume writer, improve the following description to make it more impactful, quantifiable, and aligned with industry standards.",
    untrustedData: [
      { label: "resumeContent", value: current, maxLength: 8000 },
      { label: "type", value: type, maxLength: 200 },
      { label: "industry", value: user.industry, maxLength: 200 },
    ],
    outputRules: `Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords

    Return ONLY valid JSON with this shape:
    {
      "sectionHeading": "Work Experience",
      "tone": "professional",
      "bullets": [
        "Improved API response times by 35% by optimizing database indexing and introducing query caching."
      ],
      "skills": ["Node.js", "PostgreSQL", "Performance Optimization"]
    }

    The bullets array must include 1 to 8 concise resume bullet points.`,
  });

  try {
    const structured = await generateGeminiStructuredContent({
      prompt,
      schema: resumeBulletsOutputSchema,
      schemaName: "resumeBullets",
      jsonSchemaExample: `{
  "sectionHeading": "Work Experience",
  "tone": "professional",
  "bullets": [
    "Improved API response times by 35% by optimizing database indexing and introducing query caching."
  ],
  "skills": ["Node.js", "PostgreSQL", "Performance Optimization"]
}`,
      correctionRules:
        "Ensure every bullet is specific, measurable when possible, and relevant to the provided industry.",
    });

    const improvedText = structured.bullets.map((bullet) => `- ${bullet}`).join("\n");
    return { success: true, data: improvedText, structured };
  } catch (error) {
    console.error("Error optimizing structural field elements:", error);
    return { success: false, errors: { _form: [error?.message || "AI pipeline configuration encountered an error."] } };
  }
}
