"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateRemotePitch(role, reasons, objections) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!role || !reasons) {
    return { success: false, errors: { _form: ["Role and reasons are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert HR Consultant and Negotiation Coach specializing in remote work transitions.",
    task: `Analyze the user's role and reasons for wanting to work remotely (or a 4-day workweek). Consider their manager's anticipated objections.
    Generate a compelling, data-backed business case and a script they can use to pitch this to their manager. Focus on the benefits to the COMPANY (productivity, focus, retention) rather than just personal benefits.`,
    untrustedData: [
      { label: "role", value: role, maxLength: 500 },
      { label: "reasons", value: reasons, maxLength: 2000 },
      { label: "objections", value: objections || "None provided", maxLength: 2000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "businessCase": ["Point 1 focused on company benefit", "Point 2", "Point 3"],
  "counterObjections": [
    { "objection": "The manager's fear", "rebuttal": "How to tactfully counter it" }
  ],
  "writtenProposal": "A highly professional, persuasive email they can send to their manager to formally request the transition.",
  "verbalScript": "The exact script to use when bringing this up in a 1-on-1 meeting."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.remoteWorkPitch.create({
      data: {
        userId: user.id,
        role,
        reasons,
        objections: objections || "",
        pitchData: parsedData,
      },
    });

    revalidatePath("/remote-work");
    return { success: true, data: record };
  } catch (error) {
    console.error("Remote Work Pitch Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate pitch"] } };
  }
}

export async function getRemotePitches() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.remoteWorkPitch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
