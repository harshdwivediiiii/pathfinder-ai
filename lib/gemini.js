import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isAiEnabled } from "./ai-gating";
import { getEnv } from "./env";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const FALLBACK_GEMINI_MODELS = ["gemini-1.5-pro", "gemini-2.0-flash"];

export class GeminiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code; // 'RATE_LIMITED' | 'SERVICE_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN'
    this.name = "GeminiError";
  }
}

function getGeminiModelNames() {
  const env = getEnv();
  const configuredModel = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  return Array.from(new Set([configuredModel, DEFAULT_GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS]));
}

function isModelUnavailableError(error) {
  const message = [
    error?.message,
    error?.response?.error?.message,
    error?.status,
    error?.response?.status,
  ]
    .filter(Boolean)
    .join(" ");
  return /404|400|invalid model|not found|not supported|not available|unsupported.*generateContent/i.test(message);
}

function getHttpStatus(error) {
  return error?.status || error?.httpStatus || error?.response?.status || null;
}

async function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new GeminiError("Request timed out", "TIMEOUT")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function runWithGeminiFallback(generate, timeout = 30000) {
  if (!isAiEnabled()) {
    throw new GeminiError("GEMINI_API_KEY is not configured", "UNKNOWN");
  }
  const env = getEnv();
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = getGeminiModelNames();
  const MAX_RETRIES = 3;
  let lastError;

  for (const modelName of modelNames) {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        return await withTimeout(generate(model), timeout);
      } catch (error) {
        lastError = error;

        // Already a typed timeout — bubble up immediately
        if (error instanceof GeminiError && error.code === "TIMEOUT") throw error;

        // Model doesn't exist — try next model, don't retry execution loops
        if (isModelUnavailableError(error)) break;

        const status = getHttpStatus(error);

        if (status === 429 || status === 503) {
          if (attempt < MAX_RETRIES - 1) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            console.warn(`[Gemini] ${status} on "${modelName}", retry ${attempt + 1} in ${Math.round(delay)}ms`);
            await new Promise((r) => setTimeout(r, delay));
            attempt++;
            continue;
          }
          console.error(
            "Gemini API error:",
            error?.message || error
          );
          // Retries exhausted
          throw new GeminiError(
            status === 429
              ? "AI quota reached — please try again in a few minutes."
              : "AI service temporarily unavailable — please try again shortly.",
            status === 429 ? "RATE_LIMITED" : "SERVICE_UNAVAILABLE"
          );
        }

        // Any other error — throw immediately as UNKNOWN
        console.error(
          "Gemini API error:",
          error?.message || error
        );

        throw new GeminiError(
          error.message || "Unknown AI error",
          "UNKNOWN"
        );
      }
    }

    console.warn(`[Gemini] Model "${modelName}" unavailable, trying fallback.`);
  }

  // CodeRabbit Fix: Normalize the terminal error before rethrowing
  if (lastError instanceof GeminiError) {
    throw lastError;
  }
  throw new GeminiError(lastError?.message || "Unknown AI error", "UNKNOWN");
}

export async function generateGeminiContentStream(prompt, { timeout = 30000, signal = undefined } = {}) {
  return runWithGeminiFallback((model) => model.generateContentStream(prompt, { signal }), timeout);
}

export async function generateGeminiContent(prompt, options = {}) {
  const { timeout = 30000, ...requestOptions } = options;

  return runWithGeminiFallback(
    (model) => {
      if (typeof prompt === "string" && Object.keys(requestOptions).length === 0) {
        return model.generateContent(prompt);
      }

      const request =
        typeof prompt === "string"
          ? {
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              ...requestOptions,
            }
          : {
              ...prompt,
              ...requestOptions,
            };

      return model.generateContent(request);
    },
    timeout
  );
}
