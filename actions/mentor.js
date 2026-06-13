"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function generateMentorPlan(goals, targetIndustry) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!goals || !targetIndustry) {
    return { success: false, errors: { _form: ["Goals and target industry are required."] } };
  }

  const prompt = buildSecurePrompt({
    context: "You are an Executive Career Coach specializing in networking and mentorship.",
    task: `Analyze the user's goals and target industry.
    Define the exact archetype of the mentor they should look for, draft a compelling initial cold-outreach message (email/LinkedIn), and create a structured 6-month agenda for their 1-on-1 meetings once they secure the mentor.`,
    untrustedData: [
      { label: "goals", value: goals, maxLength: 2000 },
      { label: "targetIndustry", value: targetIndustry, maxLength: 500 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "mentorArchetype": "A paragraph describing the exact type of person they should target (e.g., 'Director-level PM at a mid-stage FinTech startup who transitioned from engineering').",
  "whereToFindThem": ["List 3 specific places or methods to find this person"],
  "outreachMessage": "A concise, highly personalized cold message template that offers value and doesn't explicitly ask 'Will you be my mentor?' right away.",
  "sixMonthAgenda": [
    { "month": "Month 1", "topic": "The focus for this month", "questionsToAsk": ["Q1", "Q2"] },
    { "month": "Month 2", "topic": "The focus for this month", "questionsToAsk": ["Q1", "Q2"] },
    { "month": "Month 3", "topic": "The focus for this month", "questionsToAsk": ["Q1", "Q2"] },
    { "month": "Month 4", "topic": "The focus for this month", "questionsToAsk": ["Q1", "Q2"] },
    { "month": "Month 5", "topic": "The focus for this month", "questionsToAsk": ["Q1", "Q2"] },
    { "month": "Month 6", "topic": "The focus for this month", "questionsToAsk": ["Q1", "Q2"] }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.mentorOutreach.create({
      data: {
        userId: user.id,
        goals,
        targetIndustry,
        outreachData: parsedData,
      },
    });

    revalidatePath("/mentor-matcher");
    return { success: true, data: record };
  } catch (error) {
    console.error("Mentor Plan Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate mentor plan"] } };
  }
}

export async function getMentorOutreaches() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.mentorOutreach.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
