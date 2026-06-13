"use server";

import { auth } from "@clerk/nextjs/server";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { parseAIJson } from "@/lib/validate";

export async function generateResumeRoast(resumeContent) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  if (!resumeContent || resumeContent.trim().length < 50) {
    return { success: false, errors: { _form: ["Please paste your resume content."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are the Gordon Ramsay of technical recruiting. You are brutally honest, highly critical, witty, and slightly sarcastic, but ultimately you provide actionable and deeply constructive feedback.",
    task: `Roast the candidate's resume. Tear apart their buzzwords, point out their weak metrics, and mock their formatting choices if applicable. 
    However, after the roast, provide 3 incredibly sharp, actionable bullet points on how they can actually fix it to pass the ATS and impress a hiring manager.`,
    untrustedData: [
      { label: "resume", value: resumeContent, maxLength: 5000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "roast": "A 2-3 paragraph brutal, witty roast of their resume.",
  "score": "A harsh score out of 100 (e.g., 42)",
  "fixes": [
    "Actionable, serious fix 1",
    "Actionable, serious fix 2",
    "Actionable, serious fix 3"
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    let rawText = aiResult.response.text();
    const parsedData = parseAIJson(rawText);

    return { success: true, data: parsedData };
  } catch (error) {
    console.error("Resume Roast Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to roast resume"] } };
  }
}
