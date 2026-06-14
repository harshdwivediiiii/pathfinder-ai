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
      .refine((data) => data.options.includes(data.correctAnswer), {
        message: "correctAnswer must exactly match one of the provided options",
        path: ["correctAnswer"],
      })
    )
    .min(1, "At least one question is required.")
    .max(20, "Too many questions provided."),
}).strict();

/**
 * Human-readable schema descriptions for format-correction prompts.
 */
/**
 * Schema for AI-generated career roadmap output.
 */
export const careerRoadmapOutputSchema = z.object({
  milestones: z
    .array(
      z.object({
        title: z.string().min(3).max(100),
        description: z.string().min(10).max(500),
        skillsToLearn: z.array(z.string().min(1).max(50)).min(1).max(10),
        estimatedDuration: z.string().min(1).max(50),
        priority: z.enum(["high", "medium", "low"]),
      }).strict()
    )
    .min(3, "At least 3 milestones are required.")
    .max(20, "Too many milestones provided."),
  totalEstimatedTime: z.string().min(1).max(100),
  summary: z.string().max(300),
}).strict();

/**
 * Schema for AI-generated skill gap analysis output.
 */
export const skillGapAnalysisOutputSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  matchedSkills: z.array(z.string().min(1).max(100)),
  missingSkills: z.array(
    z.object({
      skill: z.string().min(1).max(100),
      priority: z.enum(["High", "Medium", "Low"]),
    }).strict()
  ),
  weeklyRoadmap: z.array(
    z.object({
      week: z.string().min(1).max(50),
      focus: z.string().min(5).max(200),
      tasks: z.array(z.string().min(5).max(300)).min(1),
    }).strict()
  ).min(1),
  suggestedProjects: z.array(
    z.object({
      name: z.string().min(3).max(100),
      description: z.string().min(10).max(500),
      skillsPracticed: z.array(z.string()),
    }).strict()
  ),
  interviewFocus: z.array(z.string().min(5).max(300)),
}).strict();

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
  careerRoadmap: `{
  "milestones": [
    {
      "title": "string (milestone title)",
      "description": "string (milestone description)",
      "skillsToLearn": ["skill1", "skill2", ...],
      "estimatedDuration": "string (e.g. 3-6 months)",
      "priority": "high" | "medium" | "low"
    }
  ],
  "totalEstimatedTime": "string (overall timeline)",
  "summary": "string (overall summary)"
}`,
  skillGapAnalysis: `{
  "matchPercentage": 75,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": [
    {
      "skill": "missing skill",
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "weeklyRoadmap": [
    {
      "week": "Week 1",
      "focus": "string (main focus of the week)",
      "tasks": ["task1", "task2"]
    }
  ],
  "suggestedProjects": [
    {
      "name": "Project Name",
      "description": "Project Description",
      "skillsPracticed": ["skill1"]
    }
  ],
  "interviewFocus": ["focus area 1", "focus area 2"]
}`,
};
