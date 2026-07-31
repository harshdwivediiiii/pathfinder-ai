import { z } from "zod";
import { sanitizeInput } from "../security/sanitize";
import { createPromptFingerprint } from "../cache/fingerprint";

function safeClone(data) {
  try {
    return JSON.parse(JSON.stringify(data ?? {}), (key, value) => {
      return typeof value === "string" ? sanitizeInput(value).trim() : value;
    });
  } catch {
    return data ?? {};
  }
}

export const idValueSchema = z.string().trim().min(1, "ID is required.").max(255, "ID is too long.");

export function validateId(value, fieldName = "id") {
  const result = idValueSchema.safeParse(value);

  if (!result.success) {
    return {
      success: false,
      errors: {
        [fieldName]: result.error.issues.map((issue) => issue.message),
      },
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

export function validateInput(schema, data) {
  // 1. Safe clone with injection stripping — falls back to raw data on serialization failure
  const preSanitizedData = safeClone(data);

  // 2. Compute fingerprint for observability (best-effort, does not block validation)
  const fingerprint = createPromptFingerprint(typeof preSanitizedData === "string" ? preSanitizedData : JSON.stringify(preSanitizedData).slice(0, 500));

  // 3. Validate clean parameters against active schema rules
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
 * Extracts the first complete JSON object/array embedded in arbitrary text.
 *
 * LLM responses frequently wrap JSON in conversational prose and/or markdown
 * code fences (e.g. "Here is the JSON:\n```json\n{...}\n```\nNote: ..."), which
 * makes a naive `JSON.parse` throw. This locates the first `{` or `[`, then walks
 * forward with a depth counter that is aware of string literals (so braces or
 * brackets inside quoted values do not affect nesting) and returns the exact
 * substring spanning the balanced object/array.
 *
 * @param {string} rawText - Raw AI response text.
 * @returns {string} The JSON substring (object or array) ready for `JSON.parse`.
 * @throws {Error} "No JSON payload found in AI response" when no balanced
 *   object/array can be located.
 */
export function extractJSON(rawText) {
  if (typeof rawText !== "string" || rawText.length === 0) {
    throw new Error("No JSON payload found in AI response");
  }

  const text = rawText.trim();
  let searchIndex = 0;
  let firstBalancedBlock = null;

  while (searchIndex < text.length) {
    const firstBrace = text.indexOf("{", searchIndex);
    const firstBracket = text.indexOf("[", searchIndex);

    let start;
    if (firstBrace === -1 && firstBracket === -1) {
      break;
    } else if (firstBrace === -1) {
      start = firstBracket;
    } else if (firstBracket === -1) {
      start = firstBrace;
    } else {
      start = Math.min(firstBrace, firstBracket);
    }

    const openChar = text[start];
    const closeChar = openChar === "{" ? "}" : "]";

    let depth = 0;
    let inString = false;
    let escaped = false;
    let candidateFound = false;

    for (let i = start; i < text.length; i++) {
      const char = text[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(start, i + 1);

          if (!firstBalancedBlock) {
            firstBalancedBlock = candidate;
          }

          try {
            JSON.parse(candidate);
            return candidate;
          } catch (e) {
            // Not valid JSON, continue searching from after this start character
            searchIndex = start + 1;
            candidateFound = true;
            break;
          }
        }
      }
    }

    if (!candidateFound) {
      // If we didn't find a balanced candidate from this start point, move past it
      searchIndex = start + 1;
    }
  }

  // If we found something that looked like JSON but nothing was valid,
  // return the first one so the caller can throw a descriptive parse error.
  if (firstBalancedBlock) {
    return firstBalancedBlock;
  }

  throw new Error("No JSON payload found in AI response");
}

/**
 * Extracts and parses the JSON payload from a noisy AI response.
 *
 * Combines {@link extractJSON} with `JSON.parse`, logging a consistent
 * `[AI JSON extraction error]` prefix on failure so all AI consumers share the
 * same diagnostics. Throws on either extraction or parse failure.
 *
 * @param {string} rawText - Raw AI response text.
 * @returns {any} The parsed JSON value (object or array).
 * @throws {Error} When no JSON can be extracted or the extracted JSON is invalid.
 */
export function parseAIJson(rawText) {
  let jsonString;
  try {
    jsonString = extractJSON(rawText);
  } catch (error) {
    console.error("[AI JSON extraction error]", error.message);
    throw error;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("[AI JSON extraction error] Failed to parse extracted JSON:", error.message);
    throw new Error(`Failed to parse JSON payload from AI response: ${error.message}`);
  }
}

/**
 * Validates AI-generated output against a Zod schema.
 * Extracts the embedded JSON payload from noisy text (prose and/or markdown
 * fences), parses it, then validates, returning a structured result with
 * success/errors — never throws.
 *
 * @param {import("zod").ZodSchema} schema - The output schema to validate against.
 * @param {string} rawOutput - Raw string response from Gemini.
 * @returns {{ success: boolean, data?: object, errors?: object }}
 */
export function validateOutput(schema, rawOutput) {
  if (typeof rawOutput !== "string" || !rawOutput.trim()) {
    return { success: false, errors: { _output: ["AI response was empty."] } };
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJSON(rawOutput));
  } catch (error) {
    console.error("[AI JSON extraction error]", error.message);
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
