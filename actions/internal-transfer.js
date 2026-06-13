"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateTransferStrategy(currentRole, targetRole, reasons) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!currentRole || !targetRole || !reasons) {
    return { success: false, errors: { _form: ["Current role, target role, and reasons are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Executive Career Coach specializing in internal corporate mobility.",
    task: `Analyze the user's desire to transfer from their current role to a new target role.
    Generate a pitch for the hiring manager of the new team, and a highly tactful script to break the news to their CURRENT manager without burning bridges. Provide a step-by-step strategy for the transition.`,
    untrustedData: [
      { label: "currentRole", value: currentRole, maxLength: 500 },
      { label: "targetRole", value: targetRole, maxLength: 500 },
      { label: "reasons", value: reasons, maxLength: 2000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "newManagerPitch": "A persuasive pitch to the new hiring manager explaining why their internal context makes them the perfect fit.",
  "currentManagerScript": "A highly empathetic script to tell their current manager they want to leave the team, framing it as growth rather than dissatisfaction.",
  "transitionPlan": ["Step 1", "Step 2", "Step 3 (e.g. how to handle the handoff)"],
  "potentialRisks": ["Risk 1", "Risk 2"]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.internalTransfer.create({
      data: {
        userId: user.id,
        currentRole,
        targetRole,
        reasons,
        transferData: parsedData,
      },
    });

    revalidatePath("/internal-transfer");
    return { success: true, data: record };
  } catch (error) {
    console.error("Internal Transfer Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate strategy"] } };
  }
}

export async function getInternalTransfers() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.internalTransfer.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
