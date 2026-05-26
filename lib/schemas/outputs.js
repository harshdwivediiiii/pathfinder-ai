import { z } from "zod";

/**
 * Schema for AI-improved resume entry output.
 * Ensures the response contains structured, actionable content.
 */
export const resumeImprovementOutputSchema = z.object({
  improvedContent: z
    .string()
    .min(10, "Improved content is too short.")
    .max(4000, "Improved content exceeds allowed length."),
  highlights: z
    .array(z.string().min(2).max(300))
    .min(1, "At least one highlight is required.")
    .max(8, "Too many highlights provided."),
}).strict();

/**
 * Schema for AI-generated cover letter output.
 */
export const coverLetterOutputSchema = z.object({
  greeting: z
    .string()
    .min(2, "Greeting is required.")
    .max(200, "Greeting is too long."),
  body: z
    .string()
    .min(50, "Cover letter body is too short.")
    .max(3000, "Cover letter body is too long."),
  closing: z
    .string()
    .min(2, "Closing is required.")
    .max(300, "Closing is too long."),
}).strict();

/**
 * Schema for AI-generated interview questions output.
 */
export const interviewQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(5).max(500),
        options: z.array(z.string().min(1).max(200)).length(4),
        correctAnswer: z.string().min(1).max(200),
        explanation: z.string().min(5).max(500),
      }).strict()
    )
    .min(1, "At least one question is required.")
    .max(20, "Too many questions provided."),
}).strict();

/**
 * Human-readable schema descriptions for format-correction prompts.
 */
export const SCHEMA_DESCRIPTIONS = {
  resumeImprovement: `{
  "improvedContent": "string (improved resume paragraph)",
  "highlights": ["string (key achievement)", ...]
}`,
  coverLetter: `{
  "greeting": "string (e.g. Dear Hiring Manager,)",
  "body": "string (cover letter body, 2-3 paragraphs)",
  "closing": "string (e.g. Sincerely, <name>)"
}`,
};
