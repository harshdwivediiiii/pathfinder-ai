import { z } from "zod";

/**
 * @typedef {Object} AtsSuggestion
 * @property {string} category
 * @property {string} tip
 */

export const atsSuggestionSchema = z.object({
  category: z.string().min(1, "Category is required"),
  tip: z.string().min(1, "Tip is required"),
}).strict();

/**
 * @typedef {Object} AtsHighlight
 * @property {"weak_impact" | "keyword_insertion"} type
 * @property {string} text
 * @property {string} suggestion
 */

export const atsHighlightSchema = z.object({
  type: z.enum(["weak_impact", "keyword_insertion"]),
  text: z.string().min(1, "Text from resume is required"),
  suggestion: z.string().min(1, "Suggestion is required"),
}).strict();

/**
 * @typedef {Object} AtsAnalysisOutput
 * @property {number} atsScore
 * @property {string[]} matchedKeywords
 * @property {string[]} missingKeywords
 * @property {AtsSuggestion[]} suggestions
 * @property {AtsHighlight[]} highlights
 * @property {string} overallFeedback
 */

export const atsAnalysisOutputSchema = z.object({
  atsScore: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(atsSuggestionSchema),
  highlights: z.array(atsHighlightSchema),
  overallFeedback: z.string().min(5).max(5000),
}).strict();
