import { z } from "zod";

/**
 * @typedef {Object} QuizQuestion
 * @property {string} question
 * @property {string[]} options
 * @property {string} correctAnswer
 * @property {string} explanation
 */

/**
 * @typedef {Object} InterviewQuestionsOutput
 * @property {QuizQuestion[]} questions
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
      .refine((data) => data.options.includes(data.correctAnswer), {
        message: "correctAnswer must exactly match one of the provided options",
        path: ["correctAnswer"],
      })
    )
    .min(1, "At least one question is required.")
    .max(20, "Too many questions provided."),
}).strict();

/**
 * @typedef {Object} VoiceFeedbackOutput
 * @property {number} score
 * @property {number} fillerWordsCount
 * @property {string} confidence
 * @property {string} feedback
 */

export const voiceFeedbackOutputSchema = z.object({
  score: z.number().min(0).max(100),
  fillerWordsCount: z.number().nonnegative(),
  confidence: z.string().min(1),
  feedback: z.string().min(5).max(2000),
}).strict();

/**
 * @typedef {Object} VideoFeedbackOutput
 * @property {number} score
 * @property {number} fillerWordsCount
 * @property {string} confidence
 * @property {string} bodyLanguageFeedback
 * @property {string} verbalFeedback
 */

export const videoFeedbackOutputSchema = z.object({
  score: z.number().min(0).max(100),
  fillerWordsCount: z.number().nonnegative(),
  confidence: z.string().min(1),
  bodyLanguageFeedback: z.string().min(5).max(2000),
  verbalFeedback: z.string().min(5).max(2000),
}).strict();
