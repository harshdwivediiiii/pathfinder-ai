"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { z } from "zod";
const UNAUTHORIZED_RESPONSE = {
  success: false,
  errors: { _form: ["Unauthorized"] },
};
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";

const evidenceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  url: z.string().url().optional().or(z.literal("")),
  category: z.enum(["GITHUB", "CERTIFICATE", "PROJECT", "METRIC", "ARTICLE", "RECOMMENDATION", "OTHER"]),
  description: z.string().max(2000, "Description is too long").optional().or(z.literal("")),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
});

export async function getEvidenceItems() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  try {
    const items = await db.evidenceItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: items };
  } catch (error) {
    return handleServerError(error, "evidence");
  }
}

export async function createEvidenceItem(data) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  const validation = evidenceSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    const item = await db.evidenceItem.create({
      data: {
        userId: user.id,
        ...validation.data,
      },
    });
    revalidatePath("/evidence-locker");
    return { success: true, data: item };
  } catch (error) {
    return handleServerError(error, "evidence");
  }
}

export async function updateEvidenceItem(id, data) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  const validation = evidenceSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    await db.evidenceItem.updateMany({
      where: { id, userId: user.id },
      data: validation.data,
    });
    const item = await db.evidenceItem.findUnique({ where: { id } });
    revalidatePath("/evidence-locker");
    return { success: true, data: item };
  } catch (error) {
    return handleServerError(error, "evidence");
  }
}

export async function deleteEvidenceItem(id) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return createErrorResponse("User not found");

  try {
    await db.evidenceItem.deleteMany({
      where: { id, userId: user.id },
    });
    revalidatePath("/evidence-locker");
    return { success: true };
  } catch (error) {
    return handleServerError(error, "evidence");
  }
}

export async function suggestEvidenceForText(text, evidenceItems) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  if (!evidenceItems || evidenceItems.length === 0) {
    return { success: true, data: [] };
  }

  const limit = await checkRateLimit(userId, "evidence");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Evidence suggestion limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const prompt = buildSecurePrompt({
    context: "You are an AI assistant helping a user back up their career claims with evidence.",
    task: `Given the user's claim (e.g., a resume bullet or STAR story) and their list of saved evidence items, return the IDs of the top 3 evidence items that best support this claim. Also provide a brief explanation (1 sentence) for each why it's a good fit.`,
    untrustedData: [
      { label: "claim", value: text, maxLength: 2000 },
      { label: "evidenceItems", value: JSON.stringify(evidenceItems.map(e => ({id: e.id, title: e.title, description: e.description, category: e.category}))), maxLength: 10000 },
    ],
    outputRules: `Return ONLY JSON in this format:
{
  "suggestions": [
    { "id": "evidence-id", "reason": "brief reason" }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());
    return { success: true, data: parsedData.suggestions || [] };
  } catch (error) {
    await decrementRateLimit(userId, "evidence");
    return handleServerError(error, "evidence");
  }
}
