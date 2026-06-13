"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";

export async function generateResignationLetter(circumstance, lastDay) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  if (!circumstance || !lastDay) {
    return { success: false, errors: { _form: ["Circumstance and Last Day are required."] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: `You are an expert HR professional. Draft a formal, bridge-preserving resignation letter based on the user's circumstance. 
    The tone must always be professional, respectful, and legally safe, even if the circumstance is negative (like a toxic environment). 
    Ensure it explicitly states the last day of employment: ${lastDay}.`,
    untrustedData: [
      { label: "circumstance", value: circumstance, maxLength: 500 },
    ],
    outputRules: `Provide ONLY the email/letter body as plain text (or markdown). Do not include JSON formatting. Include placeholders like [Manager Name] or [Company Name] where appropriate.`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const content = aiResult.response.text().trim();

    const record = await db.resignationLetter.create({
      data: {
        userId: user.id,
        circumstance,
        lastDay,
        content,
      },
    });

    revalidatePath("/resignation-letter");
    return { success: true, data: record };
  } catch (error) {
    console.error("Resignation Letter Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate resignation letter"] } };
  }
}

export async function getResignationLetters() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.resignationLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
