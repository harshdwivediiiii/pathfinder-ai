import { z } from "zod";
import { resumeImprovementOutputSchema } from "./resume.js";
import { coverLetterOutputSchema } from "./cover-letter.js";
import { interviewQuestionsOutputSchema } from "./interview.js";

export {
  resumeImprovementOutputSchema,
  coverLetterOutputSchema,
  interviewQuestionsOutputSchema,
};


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

export const founderReadinessOutputSchema = z.object({
  founderScore: z.number().min(0).max(100),
  strengths: z.array(z.string().min(5).max(200)).min(1).max(10),
  blindSpots: z.array(
    z.object({
      issue: z.string().min(5).max(100),
      mitigation: z.string().min(10).max(300),
    }).strict()
  ).min(1).max(5),
  businessIdeaFeedback: z.string().min(20).max(1000),
  ninetyDayRoadmap: z.array(
    z.object({
      phase: z.string().min(3).max(50),
      actionItems: z.array(z.string().min(5).max(300)).min(1).max(5),
    }).strict()
  ).length(3),
}).strict();

export const executivePresenceOutputSchema = z.object({
  personaSummary: z.string().min(20).max(1000),
  communicationUpgrades: z.array(
    z.object({
      from: z.string().min(5).max(200),
      to: z.string().min(5).max(200),
      why: z.string().min(5).max(300),
    }).strict()
  ).min(1).max(10),
  meetingStrategy: z.array(z.string().min(5).max(300)).min(1).max(5),
  gravitasBuilders: z.array(z.string().min(5).max(300)).min(1).max(5),
}).strict();

export const sideHustleIdeaOutputSchema = z.object({
  ideas: z.array(
    z.object({
      name: z.string().min(3).max(100),
      description: z.string().min(10).max(500),
      targetAudience: z.string().min(3).max(200),
      pricingStrategy: z.string().min(3).max(200),
      firstStep: z.string().min(5).max(300)
    }).strict()
  ).min(1).max(5)
}).strict();

export const remoteWorkPitchOutputSchema = z.object({
  businessCase: z.array(z.string().min(10).max(300)).min(1).max(10),
  counterObjections: z.array(
    z.object({
      objection: z.string().min(5).max(200),
      rebuttal: z.string().min(5).max(500)
    }).strict()
  ).min(1).max(10),
  writtenProposal: z.string().min(50).max(3000),
  verbalScript: z.string().min(20).max(2000)
}).strict();

export const managerReadmeOutputSchema = z.object({
  readmeMarkdown: z.string().min(50).max(5000)
}).strict();

export const imposterSyndromeOutputSchema = z.object({
  empathyStatement: z.string().min(20).max(1000),
  cognitiveReframes: z.array(
    z.object({
      theDoubt: z.string().min(5).max(300),
      theReality: z.string().min(5).max(500)
    }).strict()
  ).min(1).max(10),
  powerMantra: z.string().min(5).max(200),
  actionableAdvice: z.string().min(10).max(1000)
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
  founderReadiness: `{
  "founderScore": 85,
  "strengths": ["strength 1", "strength 2"],
  "blindSpots": [
    {
      "issue": "string (the blind spot)",
      "mitigation": "string (how to mitigate it)"
    }
  ],
  "businessIdeaFeedback": "string (feedback on the idea)",
  "ninetyDayRoadmap": [
    {
      "phase": "Month 1: Validation",
      "actionItems": ["action 1", "action 2"]
    }
  ]
}`,
  executivePresence: `{
  "personaSummary": "string (executive brand summary)",
  "communicationUpgrades": [
    {
      "from": "string (weak phrase)",
      "to": "string (strong phrase)",
      "why": "string (reason for change)"
    }
  ],
  "meetingStrategy": ["strategy 1", "strategy 2"],
  "gravitasBuilders": ["builder 1", "builder 2"]
}`,
  sideHustleIdea: `{
  "ideas": [
    {
      "name": "string",
      "description": "string",
      "targetAudience": "string",
      "pricingStrategy": "string",
      "firstStep": "string"
    }
  ]
}`,
  remoteWorkPitch: `{
  "businessCase": ["string"],
  "counterObjections": [
    {
      "objection": "string",
      "rebuttal": "string"
    }
  ],
  "writtenProposal": "string",
  "verbalScript": "string"
}`,
  managerReadme: `{
  "readmeMarkdown": "string (markdown document)"
}`,
  imposterSyndrome: `{
  "empathyStatement": "string",
  "cognitiveReframes": [
    {
      "theDoubt": "string",
      "theReality": "string"
    }
  ],
  "powerMantra": "string",
  "actionableAdvice": "string"
}`
};
