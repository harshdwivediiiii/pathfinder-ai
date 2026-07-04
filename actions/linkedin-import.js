"use server";
import { handleServerError } from "@/lib/error-handler";
import { validateAuthenticatedUser } from "@/lib/auth-user";
import { isValidAIOutput } from "@/lib/ai-validation";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth-errors";
import { db } from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { validateOutput } from "@/lib/validate";
import { generateGeminiContent } from "@/lib/gemini";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { createErrorResponse } from "@/lib/action-errors";
import { z } from "zod";
import { resumeOutputSchema } from "@/lib/schemas/resume";

const linkedInImportSchema = z.object({
  bio: z.string().optional().nullable(),
  currentRole: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  experience: z.number().optional().nullable(),
  skills: z.array(z.string()).default([]),
  resumeContent: resumeOutputSchema
}).strict();

export async function importLinkedInProfile(extractedText) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const limit = await checkRateLimit(userId, "resumeBuilder");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Import limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  if (!extractedText || extractedText.trim().length < 100) {
    return { success: false, errors: { _form: ["Please provide valid extracted text from a LinkedIn PDF (at least 100 characters)."] } };
  }
  
  const user = await getUserByClerkId(userId);
  if (!validateAuthenticatedUser(user)) {
    return createErrorResponse("User not found");
  }

  const prompt = buildSecurePrompt({
    context: "You are an expert Career Coach and Data Parser.",
    task: `Analyze the following text extracted from a user's LinkedIn PDF export or Resume PDF.
    Extract their core profile information (bio, current role, industry, years of experience, and top skills).
    Also, generate a beautifully formatted, structured JSON Resume based on their experience, education, projects, and skills.
    For the phone number or missing details, use placeholders if not found.`,
    untrustedData: [
      { label: "extractedText", value: extractedText, maxLength: 50000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "bio": "A short 2-3 sentence professional bio.",
  "currentRole": "Their current or most recent job title.",
  "industry": "Their broad industry (e.g., Software Engineering, Marketing, Finance).",
  "experience": 5, // Total years of professional experience as an integer
  "skills": ["Top Skill 1", "Top Skill 2"],
  "resumeContent": {
    "personalInfo": {
      "name": "Full Name",
      "email": "Email",
      "phone": "Phone",
      "location": "Location",
      "linkedin": "LinkedIn URL",
      "github": "GitHub URL"
    },
    "summary": "A powerful 3-4 sentence professional summary.",
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "location": "City, State",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY or Present",
        "achievements": [
          "Action verb + what you did + impact/metric"
        ]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "school": "University Name",
        "graduationDate": "MM/YYYY"
      }
    ],
    "projects": []
  }
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(linkedInImportSchema, aiResult.response.text());
    if (!isValidAIOutput(validation)) {
      console.error("LinkedIn import validation failed:", validation.errors);
      return createErrorResponse("AI returned an unexpected format. Please try again.");
    }
    
    const { bio, currentRole, industry, experience, skills, resumeContent } = validation.data;

    // Update the User profile
    await db.user.update({
      where: { id: user.id },
      data: {
        bio: bio || user.bio,
        currentRole: currentRole || user.currentRole,
        industry: industry || user.industry,
        experience: experience || user.experience,
        skills: skills && skills.length > 0 ? skills : user.skills,
      }
    });

    // Create or update the base Resume
    await db.resume.upsert({
      where: { userId: user.id },
      update: { content: JSON.stringify(resumeContent) },
      create: {
        userId: user.id,
        content: JSON.stringify(resumeContent),
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/resume-builder");
    revalidatePath("/onboarding");
    revalidatePath("/settings");

    return { success: true, data: { resumeContent } };
  } catch (error) {
    return handleServerError(error, "linkedin-import");
  }
}
