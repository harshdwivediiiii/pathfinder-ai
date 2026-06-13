"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateCheatSheet(company, role) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!company || !role) {
    return { success: false, errors: { _form: ["Company and Role are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert career strategist and executive interview coach.",
    task: `Generate a 1-page 'Day Before' Interview Briefing for a candidate interviewing for ${role} at ${company}.
    Provide insights into the company's likely culture, common interview questions for this specific role, and 3 killer, highly strategic questions the candidate should ask at the end of the interview.`,
    untrustedData: [
      { label: "company", value: company, maxLength: 100 },
      { label: "role", value: role, maxLength: 100 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "companyOverview": "A brief summary of the company's presumed core values and current market positioning.",
  "expectedQuestions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ],
  "strategicAdvice": "1-2 sentences of specific advice for this role/company.",
  "questionsToAsk": [
    "A highly strategic question to ask the interviewer.",
    "Another great question.",
    "A third great question."
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.interviewCheatSheet.create({
      data: {
        userId: user.id,
        company,
        role,
        content: parsedData,
      },
    });

    revalidatePath("/interview/cheat-sheet");
    return { success: true, data: record };
  } catch (error) {
    console.error("Cheat Sheet Generation Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate cheat sheet"] } };
  }
}

export async function getCheatSheets() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.interviewCheatSheet.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
