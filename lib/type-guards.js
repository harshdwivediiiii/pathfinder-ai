import { resumeOutputSchema } from "./schemas/resume";
import { interviewQuestionsOutputSchema } from "./schemas/interview";
import { z } from "zod";

/**
 * Validates if the provided data is a valid Resume object
 * @param {any} data - The data to validate
 * @returns {boolean} True if valid resume data, otherwise false
 */
export function isValidResume(data) {
  if (!data || typeof data !== "object") return false;
  return resumeOutputSchema.safeParse(data).success;
}

/**
 * Validates if the provided data is a valid array of Interview questions (direct or wrapped)
 * @param {any} data - The data to validate
 * @returns {boolean} True if valid quiz questions, otherwise false
 */
export function isValidQuizQuestions(data) {
  if (!data) return false;
  // If it is an array of questions directly
  if (Array.isArray(data)) {
    return interviewQuestionsOutputSchema.shape.questions.safeParse(data).success;
  }
  // If it's wrapped in an object: { questions: [...] }
  return interviewQuestionsOutputSchema.safeParse(data).success;
}

const quizQuestionResultSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctAnswer: z.string().min(1),
  userAnswer: z.string().nullable().optional().or(z.string()),
  isCorrect: z.boolean(),
  explanation: z.string().min(1),
}).strict();

const quizResultSchema = z.object({
  quizScore: z.number().min(0).max(100),
  category: z.string().min(1),
  questions: z.array(quizQuestionResultSchema).min(1),
  improvementTip: z.string().nullable().optional(),
});

/**
 * Validates if the provided data is a valid Quiz Result object
 * @param {any} data - The data to validate
 * @returns {boolean} True if valid quiz result, otherwise false
 */
export function isValidQuizResult(data) {
  if (!data || typeof data !== "object") return false;
  return quizResultSchema.safeParse(data).success;
}
