"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function decodeEquityOffer(offerDetails) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!offerDetails || !offerDetails.equityType) {
    return { success: false, errors: { _form: ["Equity details are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert startup equity compensation consultant and financial advisor.",
    task: `Analyze the following equity offer details provided by the candidate.
    Decode what the equity actually means, calculate potential values under 3 scenarios (Base Case, 3x Growth, 10x Unicorn Exit), and highlight any red flags (e.g. weird vesting schedules, high strike prices).
    Explain it so a beginner can understand.`,
    untrustedData: [
      { label: "offerDetails", value: JSON.stringify(offerDetails), maxLength: 1000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "plainEnglishExplanation": "A clear, simple explanation of what they were actually granted.",
  "redFlags": [
    "Any potential risks or gotchas to look out for (e.g. 90-day post-termination exercise window)",
    "Another risk or note"
  ],
  "scenarios": [
    { "name": "Current/Base Case", "value": "$XX,XXX", "description": "Value if company stays flat" },
    { "name": "3x Growth", "value": "$XX,XXX", "description": "Value if company triples in value" },
    { "name": "10x Unicorn", "value": "$XXX,XXX", "description": "Value in a massive exit" }
  ],
  "questionsToAskHR": [
    "Question 1 to ask the recruiter",
    "Question 2 to ask"
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.equityAnalysis.create({
      data: {
        userId: user.id,
        offerDetails,
        analysis: parsedData,
      },
    });

    revalidatePath("/equity-decoder");
    return { success: true, data: record };
  } catch (error) {
    console.error("Equity Decoder Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to decode equity"] } };
  }
}

export async function getEquityAnalyses() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.equityAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
