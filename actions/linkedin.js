"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput, parseAIJson } from "@/lib/ai/validate";
import { linkedInOptimizationSchema } from "@/lib/schemas/forms";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { buildUserProfileContext } from "@/lib/ai/ai-context";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";
import { safeFetch } from "@/lib/security/safe-fetch";

async function fetchLinkedInProfile(url) {
  try {
    // Use safeFetch to prevent SSRF attacks
    const result = await safeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch LinkedIn profile');
    }

    const html = result.text;
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) 
      || html.match(/<meta[^>]*content="([^"]+)"[^>]*name="description"/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1] : '';
    
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
      || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : '';
    
    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)
      || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i);
    const ogDesc = ogDescMatch ? ogDescMatch[1] : '';
    
    let profileContent = '';
    
    if (title) profileContent += `Title: ${title}\n`;
    if (ogTitle && ogTitle !== title) profileContent += `Headline: ${ogTitle}\n`;
    if (metaDesc) profileContent += `Summary: ${metaDesc}\n`;
    if (ogDesc && ogDesc !== metaDesc) profileContent += `About: ${ogDesc}\n`;
    
    const experienceSection = html.match(/experience[^]*?(?=education|skills|projects|$)/i);
    if (experienceSection) {
      const experiences = experienceSection[0].match(/<li[^>]*class="[^"]*experience[^"]*"[^>]*>[^]*?<\/li>/gi) || [];
      if (experiences.length > 0) {
        profileContent += '\nExperience:\n';
        experiences.slice(0, 5).forEach(exp => {
          const cleanExp = exp.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          profileContent += `- ${cleanExp}\n`;
        });
      }
    }
    
    profileContent = profileContent.trim();
    
    if (profileContent.length < 50) {
      throw new Error('Could not extract enough profile data from the URL. Please try pasting your profile text directly.');
    }
    
    return profileContent;
  } catch (error) {
    console.error('LinkedIn fetch error:', error);
    throw new Error('Failed to fetch LinkedIn profile. Please try pasting your profile text directly.');
  }
}

export async function optimizeLinkedInProfile(data) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const limit = await checkRateLimit(userId, "linkedin");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`LinkedIn optimization limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const validation = validateInput(linkedInOptimizationSchema, data);
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  let profileContent = validation.data.profileContent;

  if (!profileContent && validation.data.profileUrl) {
    try {
      profileContent = await fetchLinkedInProfile(validation.data.profileUrl);
    } catch (err) {
      return { success: false, errors: { _form: [err.message] } };
    }
  }

  if (!profileContent || profileContent.trim().length < 50) {
    return { success: false, errors: { _form: ["Profile content is too short or could not be extracted. Must be at least 50 characters."] } };
  }

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: "You are an expert LinkedIn profile optimizer and technical recruiter. Analyze the provided LinkedIn profile content and suggest improvements to maximize search visibility and recruiter engagement.",
    untrustedData: [
      { label: "profileContent", value: profileContent, maxLength: 50000 },
    ],
    outputRules: `Provide your analysis in the following JSON format ONLY:
{
  "headlineSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "summaryImprovements": "A detailed paragraph explaining how to improve the 'About' section.",
  "experienceFeedback": [
    {
      "role": "Current/Past Role Title",
      "feedback": "Specific feedback on how to rewrite the bullet points to be more impactful (e.g., add metrics)."
    }
  ],
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "overallScore": 85
}`,
  });

 try {
  const aiResult = await generateGeminiContent(prompt);

  const parsedData = parseAIJson(aiResult.response.text());

  const record = await db.linkedInOptimization.create({
    data: {
      userId: user.id,
      profileContent,
      analysis: parsedData,
    },
  });

  revalidatePath("/linkedin-optimizer");

  return {
    success: true,
    data: record,
  };
} catch (error) {
    await decrementRateLimit(userId, "linkedin");
  return handleServerError(error, "linkedin");
}
}
export async function getLinkedInOptimizations({ take = 10, skip = 0 } = {}) {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.linkedInOptimization.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return { success: true, data: records };
}
