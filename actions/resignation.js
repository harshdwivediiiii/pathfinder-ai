"use server";
import { handleServerError } from "@/lib/error-handler";
import { createErrorResponse } from "@/lib/action-errors";

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

  const parsedLastDay = new Date(lastDay);
  if (isNaN(parsedLastDay.getTime())) {
    return { success: false, errors: { _form: ["Last Day must be a valid date."] } };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedLastDay = new Date(parsedLastDay);
  normalizedLastDay.setHours(0, 0, 0, 0);

  if (normalizedLastDay < today) {
    return { success: false, errors: { _form: ["Last Day must be a future date."] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

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
    return handleServerError(error, "resignation");
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