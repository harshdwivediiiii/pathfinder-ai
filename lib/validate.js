import { sanitizeInput } from "./sanitize.js";

export function validateInput(schema, data) {
  // 1. Core Fix: Run input text formatting and injection stripping BEFORE Zod constraint assessments
  const preSanitizedData = JSON.parse(JSON.stringify(data || {}), (key, value) => {
    return typeof value === "string" ? sanitizeInput(value).trim() : value;
  });

  // 2. Validate clean parameters against active schema rules
  const result = schema.safeParse(preSanitizedData);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Strips markdown code fences from AI responses before JSON parsing.
 * Handles ```json ... ``` and ``` ... ``` patterns.
 */
export function stripMarkdownFences(raw) {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/**
 * Validates AI-generated output against a Zod schema.
 * Strips markdown fences, parses JSON defensively, and returns
 * structured result with success/errors — never throws.
 *
 * @param {import("zod").ZodSchema} schema - The output schema to validate against.
 * @param {string} rawOutput - Raw string response from Gemini.
 * @returns {{ success: boolean, data?: object, errors?: object }}
 */
export function validateOutput(schema, rawOutput) {
  if (typeof rawOutput !== "string" || !rawOutput.trim()) {
    return { success: false, errors: { _output: ["AI response was empty."] } };
  }

  const cleaned = stripMarkdownFences(rawOutput);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { success: false, errors: { _output: ["AI response was not valid JSON."] } };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  return { success: true, data: result.data };
}
