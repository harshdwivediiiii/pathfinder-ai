"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiStructuredContent } from "@/lib/gemini";
import { buildSecurePrompt, coverLetterOutputSchema } from "@/lib/prompt-safety";

/**
 * Generates a professional cover letter using Gemini AI.
 * If AI generation fails, saves a high-quality fallback cover letter.
 */
export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  if (!data?.jobTitle || !data?.companyName || !data?.jobDescription) {
    throw new Error("Missing required fields");
  }

  const prompt = buildSecurePrompt({
    task: "Write a professional cover letter for the position described below.",
    context: "You are a professional career coach and cover letter writer.",
    untrustedData: [
      { label: "jobTitle", value: data.jobTitle, maxLength: 200 },
      { label: "companyName", value: data.companyName, maxLength: 200 },
      { label: "candidateName", value: user.name || "Candidate", maxLength: 200 },
      { label: "industry", value: user.industry || "Technology", maxLength: 200 },
      { label: "experience", value: String(user.experience || "0") + " years", maxLength: 100 },
      { label: "skills", value: user.skills?.join(", ") || "Not specified", maxLength: 1000 },
      { label: "bio", value: user.bio || "Not specified", maxLength: 2000 },
      { label: "jobDescription", value: data.jobDescription, maxLength: 8000 },
    ],
    outputRules: `Requirements:
- Professional, engaging, and persuasive tone
- Max 400 words
- Highlight how the candidate's skills and experience match the job description
- Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "greeting": "Dear Hiring Manager,",
  "body": [
    "Paragraph one.",
    "Paragraph two."
  ],
  "closing": "Sincerely, Candidate",
  "tone": "professional"
}`,
  });

  try {
    const structured = await generateGeminiStructuredContent({
      prompt,
      schema: coverLetterOutputSchema,
      schemaName: "coverLetter",
      jsonSchemaExample: `{
  "greeting": "Dear Hiring Manager,",
  "body": [
    "Paragraph one.",
    "Paragraph two."
  ],
  "closing": "Sincerely, Candidate",
  "tone": "professional"
}`,
      correctionRules:
        "Body must be an array of 1 to 6 substantial paragraphs. Keep total response under 400 words.",
    });

    const content = [
      "# Cover Letter",
      "",
      structured.greeting,
      "",
      ...structured.body,
      "",
      structured.closing,
    ]
      .join("\n")
      .trim();

    if (!content) throw new Error("AI response was empty.");

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter, using fallback:", error);
    const errorCode = error?.code || "UNKNOWN";

    const fallbackContent = `
# Cover Letter

Dear Hiring Manager,

I am writing to express my interest in the ${data.jobTitle} position at ${data.companyName}. 

Based on my background in the ${user.industry || "relevant"} industry and my experience, I believe I can bring valuable skills to your team. I would love the opportunity to discuss how my qualifications align with your needs.

Thank you for your time and consideration.

Sincerely,
${user.name || "Candidate"}
`;

    const coverLetter = await db.coverLetter.create({
      data: {
        content: fallbackContent.trim(),
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        status: "fallback",
        userId: user.id,
      },
    });

    return { ...coverLetter, _errorCode: errorCode };
  }
}

/**
 * Fetches all cover letters for the signed-in user, newest first.
 */
export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  return db.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches a single cover letter by ID (ownership-checked).
 */
export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  return db.coverLetter.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });
}

/**
 * Deletes a specific cover letter record (ownership-checked).
 */
export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  return db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}
