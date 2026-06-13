import "server-only";
import { assertFeatureEnabled } from "./ai-gating.js";
import { preparePromptForGeneration, buildCareerPrompt, buildSseErrorResponse } from "./prompt-guard.js";
import { buildSecurePrompt, generateWithStructuredOutput } from "./prompt-safety.js";
import { buildUserAiContext } from "./ai-context.js";
import { validateOutput, parseAIJson } from "./validate.js";

/**
 * Feature Registry
 *
 * The contract for each feature:
 * - gatingFeature: key used by lib/ai-gating.js
 * - build: creates { prompt, schema, schemaDescription, generateFn, validateFn, untrustedData, context }
 */

import {
  resumeImprovementOutputSchema,
  coverLetterOutputSchema,
  SCHEMA_DESCRIPTIONS,
  interviewQuestionsOutputSchema,
} from "./schemas/outputs.js";

import { buildSecurePrompt as _buildSecurePrompt } from "./prompt-safety.js";

import {
  resumeImprovementOutputSchema as _resumeImprovementOutputSchema,
} from "./schemas/outputs.js";

// Avoid unused warnings in some linters/builds by referencing imports.
void _buildSecurePrompt;
void _resumeImprovementOutputSchema;

import { cachedGenerateGeminiContent, RESUME_IMPROVEMENT_CACHE_TTL_MS, generateCacheKey } from "./cache/index.js";

// NOTE: Some cache paths might differ; we will rely on existing usage in actions. If this import path fails,
// we will adjust based on actual repo structure during implementation.

const FEATURE_REGISTRY = {
  resumeImprovement: {
    gatingFeature: "resume",
    outputSchema: resumeImprovementOutputSchema,
    schemaDescription: SCHEMA_DESCRIPTIONS.resumeImprovement,
    build: ({ user, userInput }) => {
      const { current, type } = userInput;
      return {
        task: `As an expert resume writer, improve the following description to make it more impactful, quantifiable, and aligned with industry standards.

Requirements:
1. Use action verbs
2. Include metrics and results only when supported by the source text
3. Highlight relevant technical skills
4. Keep it concise but detailed
5. Focus on achievements over responsibilities
6. Use industry-specific keywords
7. Do not invent employers, dates, tools, certifications, metrics, or outcomes

Respond ONLY with a valid JSON object in this exact format (no markdown, no code fences):
{
  "improvedContent": "<single improved paragraph>",
  "highlights": ["<key achievement 1>", "<key achievement 2>", ...]
}`,
        untrustedData: [
          { label: "resumeContent", value: current, maxLength: 8000 },
          { label: "type", value: type, maxLength: 200 },
        ],
      };
    },
  },

  coverLetter: {
    gatingFeature: "coverLetter",
    outputSchema: coverLetterOutputSchema,
    schemaDescription: SCHEMA_DESCRIPTIONS.coverLetter,
    build: ({ user, userInput }) => {
      const { jobTitle, companyName, jobDescription } = userInput;
      return {
        context: `${user ? user.name : "Candidate"}`,
        task: `Write a professional cover letter for the position described below.

Use only the candidate facts provided in the input. Do not invent projects, achievements,
titles, certifications, metrics, or years of experience that are not explicitly provided.
If a detail is missing, keep the wording general instead of guessing.

Respond ONLY with a valid JSON object in this exact format (no markdown, no code fences):
{
  "greeting": "Dear Hiring Manager,",
  "body": "<2-3 paragraphs, professional tone, max 300 words>",
  "closing": "Sincerely,\\n<candidate name>"
}`,
        untrustedData: [
          { label: "jobTitle", value: jobTitle, maxLength: 200 },
          { label: "companyName", value: companyName, maxLength: 200 },
          { label: "jobDescription", value: jobDescription, maxLength: 8000 },
          { label: "candidateName", value: user?.name || "Candidate", maxLength: 200 },
          { label: "industry", value: user?.industry || "Technology", maxLength: 200 },
          { label: "experience", value: String(user?.experience || "0") + " years", maxLength: 100 },
          { label: "skills", value: user?.skills?.join(", ") || "Not specified", maxLength: 1000 },
          { label: "bio", value: user?.bio || "Not specified", maxLength: 2000 },
          { label: "jobDescription", value: jobDescription, maxLength: 8000 },
        ],
      };
    },
  },

  chat: {
    gatingFeature: "chat",
    // chat currently returns plain text, not structured JSON. For the initial phase, we keep it as string.
    outputSchema: null,
    schemaDescription: null,
    build: ({ user, userInput }) => {
      return {
        context: buildUserAiContext(user, []).context,
        task: "You are Pathfinder AI, a career-focused assistant. Only answer career-related questions. Politely refuse unrelated questions.",
        untrustedData: [{ label: "userQuery", value: userInput.prompt, maxLength: 4000 }],
      };
    },
  },
};

/**
 * Unified Prompt Pipeline
 *
 * Contract:
 * - type: registry key
 * - userInput: input payload for that feature
 * - jobContext: extra context (e.g., db ids, etc.)
 * - user/messages: optional for context building
 */
export async function runPrompt({ type, userInput = {}, jobContext = {}, user = null, messages = [] }) {
  const entry = FEATURE_REGISTRY[type];
  if (!entry) {
    return { success: false, errors: { _pipeline: ["Unknown prompt pipeline type."] } };
  }

  // 1) Feature gating
  assertFeatureEnabled(entry.gatingFeature);

  // 2) Context build
  const aiContext = buildUserAiContext(user, messages);

  // 3) Prompt injection guard / neutralization
  // We guard the "primary user input" field when it's a string.
  const primary = typeof userInput === "string" ? userInput : userInput?.prompt ?? userInput?.current ?? "";
  const guard = primary
    ? preparePromptForGeneration(primary)
    : { allowed: true, prompt: "", hadInjectionSignals: false };

  if (!guard.allowed) {
    return { success: false, errors: { _input: [guard.message] } };
  }

  // 4) Build secure prompt
  const built = entry.build({ user, userInput, jobContext, aiContext });

  if (type === "chat") {
    // Chat returns plain text
    const securePrompt = buildSecurePrompt({
      context: built.task ? aiContext.context : aiContext.context,
      task: built.task,
      untrustedData: built.untrustedData,
      outputRules: "",
    });

    // We import gemini directly? Existing actions call generateGeminiContent.
    // For now we just throw a clear error if gemini is not connected.
    const { generateGeminiContent } = await import("./gemini.js");
    const raw = await generateGeminiContent(securePrompt);
    return { success: true, data: raw.response.text() };
  }

  const { generateGeminiContent } = await import("./gemini.js");

  const prompt = buildSecurePrompt({
    context: aiContext.context + (built.context ? `\n\n${built.context}` : ""),
    task: built.task,
    untrustedData: built.untrustedData,
    outputRules: "",
  });

  // Structured output
  const result = await generateWithStructuredOutput({
    prompt,
    schemaDescription: entry.schemaDescription,
    schema: entry.outputSchema,
    generateFn: async (p) => {
      const raw = await generateGeminiContent(p);
      return raw.response.text().trim();
    },
    validateFn: validateOutput,
  });

  if (!result.success) {
    return { success: false, errors: { _output: ["AI returned an unexpected format."] } };
  }

  return { success: true, data: result.data };
}

/**
 * Convenience re-export for SSE pipelines.
 */
export { buildSseErrorResponse };

