"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/gemini";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { buildSecurePrompt } from "@/lib/prompt-safety";

export async function chatSalaryNegotiation(history, userMessage) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const limit = await checkRateLimit(userId, "negotiation");
  if (!limit.allowed) {
    return {
      success: false,
      error: `Salary negotiation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`,
    };
  }

  // Format history for Gemini
  const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Candidate' : 'HR'}: ${msg.content}`).join("\n");
  
  const prompt = buildSecurePrompt({
  context: "You are a tough, realistic HR representative at a tech company negotiating a salary offer with a candidate. Your goal is to get the best deal for the company, but you are willing to concede if the candidate makes strong, data-backed arguments (e.g., market rate, specific skills).",
  task: "Continue the salary negotiation. Do NOT break character.",
  untrustedData: [
    { label: "conversationHistory", value: formattedHistory, maxLength: 8000 },
    { label: "candidateMessage", value: userMessage, maxLength: 1000 },
  ],
  outputRules: "Keep your response concise (2-3 sentences max). Respond only as HR. Do not output JSON or markdown.",
});


  try {
    const aiResult = await generateGeminiContent(prompt);
    return { success: true, response: aiResult.response.text() };
  } catch (error) {
    console.error("Negotiation error:", error);
    return { success: false, error: "Failed to get a response." };
  }
}

export async function evaluateNegotiation(history) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const limit = await checkRateLimit(userId, "negotiation");
  if (!limit.allowed) {
    return {
      success: false,
      error: `Salary negotiation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`,
    };
  }

  const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Candidate' : 'HR'}: ${msg.content}`).join("\n");
  
  const prompt = buildSecurePrompt({
    context: "You are an expert career coach evaluating a salary negotiation transcript.",
    task: "Analyze the transcript and provide structured feedback.",
    untrustedData: [
      { label: "transcript", value: formattedHistory, maxLength: 10000 },
    ],
    outputRules: `Provide feedback in JSON format ONLY. Do not output any markdown code fences or extra text:
  {
    "score": 85,
    "strengths": ["You anchored well.", "You remained polite but firm."],
    "weaknesses": ["You accepted the first counter-offer too quickly."],
    "overallFeedback": "Good job, but you left some money on the table."
  }`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    let rawText = aiResult.response.text();
    // remove markdown block
    if (rawText.startsWith("\`\`\`json")) {
      rawText = rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    }
    const parsed = JSON.parse(rawText);
    return { success: true, data: parsed };
  } catch (error) {
    console.error("Negotiation evaluation error:", error);
    return { success: false, error: "Failed to evaluate negotiation." };
  }
}
