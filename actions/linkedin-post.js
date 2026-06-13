"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function generateLinkedInPosts(topic) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  if (!topic || topic.trim().length < 10) {
    return { success: false, errors: { _form: ["Please provide a valid topic."] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  const rateLimitResult = await checkRateLimit(user.id, "linkedin");
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      errors: {
        _form: [
          `Rate limit exceeded. Try again in ${formatResetTime(rateLimitResult.resetAt)}.`,
        ],
      },
    };
  }
  
  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: `You are an expert personal branding coach and social media manager. 
    Draft 3 highly engaging, professional LinkedIn posts about the provided topic. 
    Use engaging hooks, appropriate spacing, emojis, and relevant hashtags to maximize visibility for recruiters.`,
    untrustedData: [
      { label: "topic", value: topic, maxLength: 1000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "posts": [
    {
      "style": "Storytelling / Inspirational",
      "content": "The full text of the post."
    },
    {
      "style": "Direct & Professional",
      "content": "The full text of the post."
    },
    {
      "style": "Value / Advice Driven",
      "content": "The full text of the post."
    }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.linkedInPost.create({
      data: {
        userId: user.id,
        topic,
        content: parsedData,
      },
    });

    revalidatePath("/linkedin-post");
    return { success: true, data: record };
  } catch (error) {
    console.error("LinkedIn Post Generation Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate posts"] } };
  }
}

export async function getLinkedInPosts() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.linkedInPost.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
