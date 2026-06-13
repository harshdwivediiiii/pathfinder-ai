"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";

export async function generateProposal(projectDetails, rate) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  if (!projectDetails || !rate) {
    return { success: false, errors: { _form: ["Project Details and Rate are required."] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user) + "\nYou are an expert freelance consultant and sales copywriter.",
    task: `Draft a highly professional, persuasive freelance proposal based on the project details.
    Include sections for Executive Summary, Proposed Solution, Timeline, and Investment (where you state the rate: ${rate}).
    The tone should be confident, value-driven, and designed to win the contract.`,
    untrustedData: [
      { label: "projectDetails", value: projectDetails, maxLength: 2000 },
    ],
    outputRules: `Provide ONLY the proposal body as formatted markdown. Do not include JSON formatting.`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const content = aiResult.response.text().trim();

    const record = await db.freelanceProposal.create({
      data: {
        userId: user.id,
        projectDetails,
        rate,
        content,
      },
    });

    revalidatePath("/freelance-proposal");
    return { success: true, data: record };
  } catch (error) {
    console.error("Freelance Proposal Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate proposal"] } };
  }
}

export async function getFreelanceProposals() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.freelanceProposal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
