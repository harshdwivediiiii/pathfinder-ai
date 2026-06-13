"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateStarStory(rawExperience) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!rawExperience || rawExperience.trim().length < 20) {
    return { success: false, errors: { _form: ["Please provide a valid experience description."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert career coach helping a candidate prepare for behavioral interviews.",
    task: `Transform the candidate's raw experience into a perfectly structured STAR format (Situation, Task, Action, Result). 
    Enhance the professional tone, highlight the impact, and ensure it sounds compelling for an interview.`,
    untrustedData: [
      { label: "rawExperience", value: rawExperience, maxLength: 3000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "title": "A short 3-5 word title for this story",
  "situation": "Describe the context or background.",
  "task": "Describe the challenge or expectation.",
  "action": "Describe exactly what the candidate did, focusing on their specific contributions and skills used.",
  "result": "Describe the positive outcome, using metrics or concrete impact if possible."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.starStory.create({
      data: {
        userId: user.id,
        rawExperience,
        starContent: parsedData,
      },
    });

    revalidatePath("/interview/star-builder");
    return { success: true, data: record };
  } catch (error) {
    console.error("STAR Story Generation Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate STAR story"] } };
  }
}

export async function getStarStories() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.starStory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
