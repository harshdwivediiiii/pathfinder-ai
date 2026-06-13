"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput, parseAIJson } from "@/lib/validate";
import { projectIdeaSchema } from "@/lib/schemas/forms";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function generateProjectIdeas(data) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const limit = await checkRateLimit(userId, "portfolio");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Project idea generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const validation = validateInput(projectIdeaSchema, data);
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: "You are an expert technical mentor. Generate 3 unique side-project ideas that will help the user learn their 'Skill Gap' and look impressive on a resume for their 'Target Role'. Each project must include a step-by-step roadmap.",
    untrustedData: [
      { label: "targetRole", value: validation.data.targetRole, maxLength: 100 },
      { label: "skillGap", value: validation.data.skillGap, maxLength: 100 },
    ],
    outputRules: `Provide your analysis in the following JSON format ONLY:
{
  "projects": [
    {
      "title": "Project Name",
      "description": "A 2-sentence description of what it is and why it helps learn the skill.",
      "difficulty": "Beginner | Intermediate | Advanced",
      "roadmap": ["Step 1: Setup", "Step 2: Build X", "Step 3: Deploy Y"]
    }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.projectIdea.create({
      data: {
        userId: user.id,
        targetRole: validation.data.targetRole,
        skillGap: validation.data.skillGap,
        ideas: parsedData,
      },
    });

    revalidatePath("/project-ideas");
    return { success: true, data: record };
  } catch (error) {
    console.error("Project Idea Generation Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate project ideas"] } };
  }
}

export async function getProjectIdeas() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.projectIdea.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
