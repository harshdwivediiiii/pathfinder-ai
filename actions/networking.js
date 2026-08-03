"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput } from "@/lib/ai/validate";
import { networkingEmailSchema } from "@/lib/schemas/forms";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { buildUserProfileContext } from "@/lib/ai/ai-context";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";

export async function generateNetworkingEmail(data) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const limit = await checkRateLimit(userId, "networking");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Networking email generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const validation = validateInput(networkingEmailSchema, data);
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
task: `You are an expert career coach and professional copywriter.

Write three highly personalized networking emails.

Use the recipient information, company, goal, and additional context.

If sender information (name, phone number, LinkedIn, GitHub, or portfolio) is provided, include it naturally in the email signature.

Do not use placeholders such as [Your Name], [Your Phone Number], or [Your LinkedIn Profile].

If any sender field is empty, simply omit it instead of displaying a placeholder.`,
    untrustedData: [
  { label: "recipientName", value: validation.data.recipientName || "Hiring Manager", maxLength: 200 },
  { label: "company", value: validation.data.company || "Your Company", maxLength: 200 },
  { label: "goal", value: validation.data.goal, maxLength: 200 },
  { label: "context", value: validation.data.context || "No additional context provided.", maxLength: 1500 },

  { label: "senderName", value: validation.data.senderName || "", maxLength: 200 },
  { label: "phoneNumber", value: validation.data.phoneNumber || "", maxLength: 50 },
  { label: "linkedIn", value: validation.data.linkedIn || "", maxLength: 300 },
  { label: "github", value: validation.data.github || "", maxLength: 300 },
  { label: "portfolio", value: validation.data.portfolio || "", maxLength: 300 },
],
    outputRules: `Provide exactly 3 variations of the email. Use clear formatting, subject lines, and appropriate tone.
Variation 1: Direct and concise.
Variation 2: Value-focused (highlighting how the user can help them).
Variation 3: Conversational and relationship-focused.

Output the 3 variations clearly separated by headings (e.g. ### Variation 1). Do not output JSON, just plain markdown text.`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const content = aiResult.response.text();

    const record = await db.networkingEmail.create({
      data: {
        userId: user.id,
        recipientName: validation.data.recipientName,
        company: validation.data.company,
        goal: validation.data.goal,
        content: content,
      },
    });

    revalidatePath("/networking");
    return { success: true, data: record };
  } catch (error) {
    await decrementRateLimit(userId, "networking");
    return handleServerError(error, "networking");
  }
}

export async function getNetworkingEmails() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.networkingEmail.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
