"use server";
import { handleServerError } from "@/lib/error-handler";
import { validateAuthenticatedUser } from "@/lib/auth-user";
import { JOB_DESCRIPTION_MAX_LENGTH } from "@/lib/input-limits";
import { isValidAIOutput } from "@/lib/ai-validation";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth-errors";
import { db } from "@/lib/prisma";
import { getHistoryUserContext } from "@/lib/history-auth";
import { getUserByClerkId } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { validateOutput } from "@/lib/validate";
import { resumeOutputSchema } from "@/lib/schemas/resume";
import { generateGeminiContent } from "@/lib/gemini";
import { buildUserProfileContext } from "@/lib/ai-context";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { EMPTY_HISTORY_RESPONSE } from "@/lib/history-response";
import { createErrorResponse } from "@/lib/action-errors";
async function getResumeBuilderUser(userId) {
  return getUserByClerkId(userId);
}
export async function generateResumeContent(jobDescription) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  const limit = await checkRateLimit(userId, "resumeBuilder");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Resume generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  if (!jobDescription || jobDescription.trim().length < 50) {
    return { success: false, errors: { _form: ["Please provide a valid job description (at least 50 characters)."] } };
  }
  
  const user = await getResumeBuilderUser(userId);
  if (!validateAuthenticatedUser(user)) {
    return createErrorResponse("User not found");
  }

  const prompt = buildSecurePrompt({
    context: buildUserProfileContext(user),
    task: `You are an expert Executive Resume Writer. Create a tailored, ATS-compliant resume based on the user's profile and the target job description. 
    Ensure keywords from the job description are naturally integrated. Focus on impact and metrics.`,
    untrustedData: [
      { label: "jobDescription", value: jobDescription, maxLength: JOB_DESCRIPTION_MAX_LENGTH },
    ],
    outputRules: `Provide the resume data in the following JSON format ONLY:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "Email",
    "phone": "Phone (generate realistic placeholder if missing)",
    "location": "City, State",
    "linkedin": "LinkedIn URL",
    "github": "GitHub URL (optional)"
  },
  "summary": "A powerful 3-4 sentence professional summary tailored to the job description.",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "achievements": [
        "Action verb + what you did + impact/metric",
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
  "projects": [
    {
      "name": "Project Name",
      "technologies": ["Tech 1", "Tech 2"],
      "description": "1-2 sentences describing the project and its impact."
    }
  ]
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(resumeOutputSchema, aiResult.response.text());
    if (!isValidAIOutput(validation)) {
      console.error("Resume output validation failed:", validation.errors);
      return createErrorResponse("AI returned an unexpected format. Please try again.");
    }
    const parsedData = validation.data;

    const record = await db.resumeGeneration.create({
      data: {
        userId: user.id,
        jobDescription: jobDescription,
        content: parsedData,
      },
    });

    revalidatePath("/resume-builder");
    return { success: true, data: record };
  } catch (error) {
    return handleServerError(error, "resume-builder");
  }
}

export async function getResumeHistory() {
  try {
    const user = await getHistoryUserContext();

    if (!user) return EMPTY_HISTORY_RESPONSE;

    const records = await db.resumeGeneration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: records };
  } catch (error) {
    console.error("Resume history error:", error);
    throw error;
  }
}