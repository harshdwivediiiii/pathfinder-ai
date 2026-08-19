"use server";
import { handleServerError } from "@/lib/errors/error-handler";

import { db } from "@/lib/db/prisma";
import { getUserByClerkId } from "@/lib/auth/user";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { getHistoryUser } from "@/lib/history/history-user";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";
import { EMPTY_HISTORY_RESPONSE } from "@/lib/history/history-response";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth/auth-errors";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";

export async function buildReadme(style, boundaries, feedback) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const limit = await checkRateLimit(userId, "managerReadme");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Manager README limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const user = await getHistoryUser(userId);
  if (!user) return createErrorResponse("User not found");

  if (!style || !boundaries || !feedback) {
    return { success: false, errors: { _form: ["All fields are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Expert Executive Leadership Coach.",
    task: `Analyze the user's leadership style, boundaries/quirks, and feedback preferences.
    Draft a comprehensive, highly readable 'Manager README' (a guide on how to work with them) to share with their new team.
    The tone should be approachable, extremely clear, vulnerable, and professional.`,
    untrustedData: [
      { label: "style", value: style, maxLength: 1000 },
      { label: "boundaries", value: boundaries, maxLength: 1000 },
      { label: "feedback", value: feedback, maxLength: 1000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "readmeMarkdown": "A complete, well-structured Markdown document containing the following sections: '# Working with Me', '## My Role (What I do)', '## Communication Style', '## Boundaries & Quirks', '## How I give and receive feedback'. Use bullet points and bold text for readability. Do not wrap in markdown code blocks."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.managerReadme.create({
      data: {
        userId: user.id,
        style,
        boundaries,
        feedback,
        readmeData: parsedData,
      },
    });

    revalidatePath("/manager-readme");
    return { success: true, data: record };
  } catch (error) {
    await decrementRateLimit(userId, "managerReadme");
    return handleServerError(error, "manager-readme");
  }
}

export async function getManagerReadmes() {
  const { userId } = await auth();
  if (!userId) return EMPTY_HISTORY_RESPONSE;

  const user = await getHistoryUser(userId);
  if (!user) return { success: false, data: [] };

  const records = await db.managerReadme.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
