"use server";
import { createErrorResponse } from "@/lib/action-errors";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput, parseAIJson } from "@/lib/validate";
import { cultureMatchSchema } from "@/lib/schemas/forms";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { safeFetch } from "../lib/safe-fetch.js";

export async function generateCultureMatch(data) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const limit = await checkRateLimit(userId, "cultureMatch");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Culture Match limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const validation = validateInput(cultureMatchSchema, data);
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      ikigaiDiscoveries: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
  if (!user) return createErrorResponse("User not found");

  const ikigaiData = user.ikigaiDiscoveries?.[0];
  if (!ikigaiData) {
    return { success: false, errors: { _form: ["Please complete the Ikigai Discovery module first to establish your core values."] } };
  }

  let companyContent = validation.data.companyContent;
  let companyUrl = validation.data.companyUrl;

  if (companyUrl && !companyContent) {
    try {
      const res = await safeFetch(companyUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (!res.success) return res;
      const html = res.text();
      
      // Basic extraction: remove script, style, and extract body text
      let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                     .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
                     
      companyContent = text.substring(0, 10000); // limit to 10k chars
    } catch (err) {
      console.error("URL Fetch Error:", err);
      return { success: false, errors: { _form: ["Failed to extract text from URL. Please use the Paste Text option instead."] } };
    }
  }

  if (!companyContent || companyContent.trim().length < 50) {
    return { success: false, errors: { _form: ["Company content is too short or could not be extracted."] } };
  }

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: "You are an expert Career Coach. Compare the provided Company Culture/Values text against the user's Ikigai (Passions, Skills, Market Needs) and generate a personalized Culture Match Report.",
    untrustedData: [
      { label: "companyContent", value: companyContent, maxLength: 20000 },
      { label: "userPassions", value: ikigaiData.passions, maxLength: 2000 },
      { label: "userValues", value: JSON.stringify(ikigaiData.ikigaiData), maxLength: 5000 },
    ],
    outputRules: `Provide your analysis in the following JSON format ONLY:
{
  "alignmentScore": 85,
  "summary": "A 2-sentence summary of how well the user's values align with the company's culture.",
  "greenFlags": ["positive point 1", "positive point 2"],
  "redFlags": ["potential concern 1", "potential concern 2"],
  "recommendedQuestions": [
    {
      "question": "The actual question to ask the interviewer.",
      "rationale": "Why the candidate should ask this based on the potential red flags or misalignments."
    }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.cultureMatch.create({
      data: {
        userId: user.id,
        companyUrl: companyUrl,
        companyContent: companyContent,
        analysis: parsedData,
      },
    });

    revalidatePath("/culture-matcher");
    return { success: true, data: record };
  } catch (error) {
    console.error("Culture Match Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate culture match"] } };
  }
}

export async function getCultureMatches({ take = 10, skip = 0 } = {}) {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.cultureMatch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return { success: true, data: records };
}
