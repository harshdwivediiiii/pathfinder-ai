import { z } from "zod";

/**
 * @typedef {Object} CoverLetterOutput
 * @property {string} greeting
 * @property {string} body
 * @property {string} closing
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
