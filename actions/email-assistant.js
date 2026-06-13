"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";

export async function generateEmailReply(originalEmail, goal) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  if (!originalEmail || !goal) {
    return { success: false, errors: { _form: ["Email and goal are required."] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: `You are an expert career coach helping a candidate reply to a recruiter or hiring manager. 
    Draft a professional, concise, and perfectly toned email reply based on the original email and the candidate's goal.`,
    untrustedData: [
      { label: "originalEmail", value: originalEmail, maxLength: 5000 },
      { label: "goal", value: goal, maxLength: 100 },
    ],
    outputRules: `Provide ONLY the email body as plain text (or markdown). Do not include JSON formatting. Include placeholders like [Your Name] if necessary.`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const replyContent = aiResult.response.text().trim();

    const record = await db.recruiterEmail.create({
      data: {
        userId: user.id,
        originalEmail,
        goal,
        replyContent,
      },
    });

    revalidatePath("/email-assistant");
    return { success: true, data: record };
  } catch (error) {
    console.error("Email Generation Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate email reply"] } };
  }
}

export async function getEmailHistory() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.recruiterEmail.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
