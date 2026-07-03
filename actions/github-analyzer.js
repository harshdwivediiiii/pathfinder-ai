"use server";
import { createErrorResponse } from "@/lib/action-errors";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput, parseAIJson } from "@/lib/validate";
import { githubAnalyzerSchema } from "@/lib/schemas/forms";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function optimizeGithubProfile(data) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const limit = await checkRateLimit(userId, "githubAnalyzer");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`GitHub analyzer limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  const validation = validateInput(githubAnalyzerSchema, data);
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  let profileContent = validation.data.profileContent;
  let githubUrl = validation.data.githubUrl;

  if (githubUrl) {
    try {
      // Extract username from URL
      let username = githubUrl.trim().replace(/\/$/, "");
      username = username.substring(username.lastIndexOf("/") + 1);

      // Fetch user profile
      const userRes = await fetch(`https://api.github.com/users/${username}`, {
        headers: { "User-Agent": "PathfinderAI-GitHub-Analyzer" }
      });
      
      if (!userRes.ok) {
        throw new Error(`GitHub User API error: ${userRes.statusText}`);
      }
      const userData = await userRes.json();

      // Fetch repos
      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`, {
        headers: { "User-Agent": "PathfinderAI-GitHub-Analyzer" }
      });
      let reposData = [];
      if (reposRes.ok) {
        reposData = await reposRes.json();
      }

      profileContent = `
Username: ${userData.login}
Name: ${userData.name || ''}
Bio: ${userData.bio || ''}
Public Repos: ${userData.public_repos}
Followers: ${userData.followers}
Following: ${userData.following}

Recent Repositories:
${reposData.map(repo => `- ${repo.name} (Stars: ${repo.stargazers_count}, Language: ${repo.language}): ${repo.description || 'No description'}`).join('\n')}
      `.trim();
    } catch (err) {
      console.error("GitHub API Error:", err);
      return { success: false, errors: { _form: ["Failed to fetch data from GitHub. Make sure the URL is correct and public."] } };
    }
  }

  if (!profileContent || profileContent.trim().length < 20) {
    return { success: false, errors: { _form: ["Profile content is too short or could not be extracted."] } };
  }

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: "You are an expert Senior Software Engineer and Tech Recruiter. Analyze the provided GitHub profile information and suggest improvements to maximize developer presence, impress recruiters, and showcase technical skills.",
    untrustedData: [
      { label: "profileContent", value: profileContent, maxLength: 50000 },
    ],
    outputRules: `Provide your analysis in the following JSON format ONLY:
{
  "bioSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "readmeImprovements": "A detailed paragraph explaining how to improve their profile README or repository READMEs based on their tech stack.",
  "repoFeedback": [
    {
      "repoName": "Name of the repo (or a general suggestion)",
      "feedback": "Specific feedback on how to make this repo look more professional (e.g. adding a CI/CD badge, better description)."
    }
  ],
  "activitySuggestions": ["suggestion to improve commit graph or contribution frequency"],
  "overallScore": 85
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.githubAnalysis.create({
      data: {
        userId: user.id,
        githubUrl: githubUrl,
        profileContent: profileContent,
        analysis: parsedData,
      },
    });

    revalidatePath("/github-analyzer");
    return { success: true, data: record };
  } catch (error) {
    console.error("GitHub Analyzer Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate optimization"] } };
  }
}

export async function getGithubAnalyses({ take = 10, skip = 0 } = {}) {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const records = await db.githubAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return { success: true, data: records };
}
