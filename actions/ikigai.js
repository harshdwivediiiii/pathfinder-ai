"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function discoverIkigai(passions, skills, marketNeeds) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!passions || !skills || !marketNeeds) {
    return { success: false, errors: { _form: ["All fields are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Expert Career Coach and Life Strategist who specializes in the Ikigai framework.",
    task: `Analyze what the user loves (passions), what they are good at (skills), and what they believe the world needs/will pay for (market needs).
    Find the intersection of these elements to propose 3 distinct 'Ikigai' career paths or side businesses that blend purpose, passion, and profit.`,
    untrustedData: [
      { label: "passions", value: passions, maxLength: 1000 },
      { label: "skills", value: skills, maxLength: 1000 },
      { label: "marketNeeds", value: marketNeeds, maxLength: 1000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "ikigaiPaths": [
    {
      "title": "Path 1 Title",
      "description": "Why this fits their Ikigai perfectly",
      "firstStep": "The very first action they should take to explore this path"
    },
    {
      "title": "Path 2 Title",
      "description": "Why this fits their Ikigai perfectly",
      "firstStep": "The very first action they should take to explore this path"
    },
    {
      "title": "Path 3 Title",
      "description": "Why this fits their Ikigai perfectly",
      "firstStep": "The very first action they should take to explore this path"
    }
  ],
  "missionStatement": "A synthesized, inspiring 1-sentence personal mission statement summarizing their unique intersection."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.ikigaiDiscovery.create({
      data: {
        userId: user.id,
        passions,
        skills,
        marketNeeds,
        ikigaiData: parsedData,
      },
    });

    revalidatePath("/ikigai");
    return { success: true, data: record };
  } catch (error) {
    console.error("Ikigai Discovery Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate Ikigai"] } };
  }
}

export async function getIkigaiDiscoveries() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.ikigaiDiscovery.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
