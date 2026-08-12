"use server";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai/ai-context";
function revalidatePortfolioBuilder() {
  revalidatePath("/portfolio-builder");
}
function normalizePortfolioContent(content) {
  if (!content) return content;
  if (content.projects && Array.isArray(content.projects)) {
    content.projects = content.projects.map(proj => {
      let techStack = proj.techStack;
      if (typeof techStack === 'string') {
        techStack = techStack.split(',').map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(techStack)) {
        techStack = [];
      } else {
        techStack = techStack.filter(Boolean);
      }
      return { ...proj, techStack };
    });
  }
  return content;
}

// Helper to check user session and db record
async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { error: "User not found" };
  return { user };
}

export async function generatePortfolio(slug) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return { success: false, errors: { _form: [error] } };

  // Fetch base resume
  const resume = await db.resume.findUnique({
    where: { userId: user.id },
  });

  if (!resume || !resume.content) {
    return { success: false, errors: { _form: ["No resume found. Please build or upload a resume first."] } };
  }

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: `You are an expert web developer and designer. Your task is to extract information from the user's resume and generate a highly structured JSON representation of a personal portfolio website.

The JSON MUST match this exact schema:
{
  "hero": {
    "headline": "A catchy professional headline",
    "subheadline": "A 1-2 sentence professional summary"
  },
  "about": {
    "content": "A detailed 2-3 paragraph professional bio"
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "e.g., Jan 2020 - Present",
      "description": "What you achieved"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What the project is and technologies used",
      "link": "URL if available, otherwise empty string",
      "techStack": ["Skill 1", "Skill 2"],
      "image": ""
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}

Rules:
1. Extract the data ONLY from the provided resume text. Do NOT make up information.
2. If a section is missing from the resume, leave it as an empty array or reasonable default.
3. Keep the JSON flat and exactly as requested.
4. Output raw JSON only. Do not include markdown code block syntax like \`\`\`json.`,
    untrustedData: [
      { label: "resumeContent", value: resume.content, maxLength: 8000 },
    ],
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const rawText = aiResult.response.text();
    // Safely parse the JSON
    let parsedContent;
    try {
      // Remove any markdown block syntax if present
      const cleaned = rawText.replace(/^```json/g, "").replace(/```$/g, "").trim();
      parsedContent = JSON.parse(cleaned);
      parsedContent = normalizePortfolioContent(parsedContent);
    } catch (e) {
      console.error("Failed to parse Gemini output as JSON", e, rawText);
      return { success: false, errors: { _form: ["Failed to generate valid portfolio structure. Please try again."] } };
    }

    // Default slug logic if none provided
    let userSlug = slug || user.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || user.id.slice(0, 8);

    // Check slug uniqueness against other users (mirrors updatePortfolio)
    const existingWithSlug = await db.portfolio.findFirst({
      where: {
        slug: userSlug,
        userId: { not: user.id },
      },
    });
    if (existingWithSlug) {
      userSlug = `${userSlug}-${user.id.slice(0, 8)}`;
    }

    const portfolio = await db.portfolio.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content: parsedContent,
        slug: userSlug,
      },
      create: {
        userId: user.id,
        content: parsedContent,
        slug: userSlug,
      },
    });

    revalidatePortfolioBuilder();
    return { success: true, data: portfolio };
  } catch (err) {
    console.error("Portfolio Generation Error:", err);
    return { success: false, errors: { _form: ["Failed to generate portfolio. Please try again later."] } };
  }
}

export async function getPortfolio() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return null;

    return await db.portfolio.findUnique({
      where: { userId: user.id },
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return null;
  }
}

export async function updatePortfolio(data) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return { success: false, errors: { _form: [error] } };

    // Check slug uniqueness
    if (data.slug) {
      const existing = await db.portfolio.findFirst({
        where: { 
          slug: data.slug,
          userId: { not: user.id }
        },
      });
      if (existing) {
        return { success: false, errors: { _form: ["This URL slug is already taken."] } };
      }
    }

    const normalizedContent = data.content ? normalizePortfolioContent(data.content) : undefined;

    const portfolio = await db.portfolio.update({
      where: { userId: user.id },
      data: {
        ...(normalizedContent && { content: normalizedContent }),
        ...(data.theme && { theme: data.theme }),
        ...(data.slug && { slug: data.slug }),
        ...(typeof data.isPublished === "boolean" && { isPublished: data.isPublished }),
      },
    });

    revalidatePortfolioBuilder();
    revalidatePath(`/p/${portfolio.slug}`);
    return { success: true, data: portfolio };
  } catch (err) {
    console.error("Error updating portfolio:", err);
    return { success: false, errors: { _form: ["Failed to update portfolio settings."] } };
  }
}

export async function getPublicPortfolio(slug) {
  try {
    const portfolio = await db.portfolio.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
            imageUrl: true,
          }
        }
      }
    });

    if (!portfolio || !portfolio.isPublished) {
      return null;
    }
    return portfolio;
  } catch (error) {
    console.error("Error fetching public portfolio:", error);
    return null;
  }
}
