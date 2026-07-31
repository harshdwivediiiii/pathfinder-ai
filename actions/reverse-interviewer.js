"use server";
import { handleServerError } from "@/lib/error-handler";
import { validateAuthenticatedUser } from "@/lib/auth-user";
import { isValidAIOutput } from "@/lib/ai-validation";
import { UNAUTHORIZED_RESPONSE } from "@/lib/auth-errors";
import { getUserByClerkId } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { validateOutput } from "@/lib/validate";
import { generateGeminiContent } from "@/lib/gemini";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";
import { createErrorResponse } from "@/lib/action-errors";
import { z } from "zod";

const reverseInterviewerSchema = z.object({
  showOffQuestions: z.array(z.object({
    question: z.string(),
    strategy: z.string()
  })).min(2).max(2),
  redFlagQuestions: z.array(z.object({
    question: z.string(),
    strategy: z.string()
  })).min(2).max(2),
  closingQuestion: z.object({
    question: z.string(),
    strategy: z.string()
  })
}).strict();

export async function generateQuestions(jobTitle, companyContext, interviewerRole) {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED_RESPONSE;

  if (!jobTitle || !companyContext || !interviewerRole) {
    return { success: false, errors: { _form: ["Please provide all required fields."] } };
  }

  const limit = await checkRateLimit(userId, "reverseInterviewer");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`Question limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }
  
  const user = await getUserByClerkId(userId);
  if (!validateAuthenticatedUser(user)) {
    return createErrorResponse("User not found");
  }

  const prompt = buildSecurePrompt({
    context: "You are an elite career strategist helping a candidate prepare for an upcoming job interview. You know that asking the right questions at the end of the interview is crucial for standing out and avoiding toxic companies.",
    task: `Generate 5 highly strategic questions for the candidate to ask the interviewer. Tailor the questions specifically to the Job Title, the Company Context/Industry, and crucially, the Interviewer's Role (e.g. asking a Recruiter vs asking a Peer vs asking a Hiring Manager).
    
    Categories:
    1. Two "Show-Off" questions: These prove the candidate understands the business, the market, or the technical challenges of the role.
    2. Two "Red Flag Exposer" questions: These are subtly phrased questions designed to uncover toxic culture, bad work-life balance, or high turnover WITHOUT sounding aggressive or negative.
    3. One "Closer" question: The perfect final question to gauge where the candidate stands, ask for reservations, or leave a lasting, confident impression.`,
    untrustedData: [
      { label: "Job Title", value: jobTitle, maxLength: 200 },
      { label: "Company Context", value: companyContext, maxLength: 200 },
      { label: "Interviewer Role", value: interviewerRole, maxLength: 200 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "showOffQuestions": [
    {
      "question": "The exact question to ask.",
      "strategy": "Why this works and what it signals to the interviewer."
    }
  ],
  "redFlagQuestions": [
    {
      "question": "The exact question to ask.",
      "strategy": "What red flags this will uncover."
    }
  ],
  "closingQuestion": {
    "question": "The exact question to ask.",
    "strategy": "Why this is a strong closer."
  }
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(reverseInterviewerSchema, aiResult.response.text());
    
    if (!isValidAIOutput(validation)) {
      console.error("Reverse Interviewer validation failed:", validation.errors);
      return createErrorResponse("AI returned an unexpected format. Please try again.");
    }

    return { success: true, data: validation.data };
  } catch (error) {
    return handleServerError(error, "reverse-interviewer");
  }
}
