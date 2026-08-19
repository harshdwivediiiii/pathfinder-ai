import "server-only";
import { getEnv } from "../security/env";

const FEATURE_ENV_REQUIREMENTS = {
  chat: ["GEMINI_API_KEY"],
  ats: ["GEMINI_API_KEY"],
  coverLetter: ["GEMINI_API_KEY"],
  interview: ["GEMINI_API_KEY"],
  roadmap: ["GEMINI_API_KEY"],
  insights: ["GEMINI_API_KEY"],
  bulletRewriter: ["GEMINI_API_KEY"],
  careerDecisionSimulator: ["GEMINI_API_KEY"],
};

/**
 * Checks if the general AI capability is enabled.
 * Returns true if GEMINI_API_KEY is configured.
 */
function isValidApiKey(key) {
  return Boolean(
    key &&
    typeof key === "string" &&
    key.trim() !== "" &&
    key !== "undefined" &&
    key !== "null"
  );
}

export function isAiEnabled() {
  const env = getEnv();
  return isValidApiKey(env.GEMINI_API_KEY);
}

/**
 * Checks if a specific AI feature is enabled based on required environment keys.
 * If the feature is not configured in FEATURE_ENV_REQUIREMENTS, defaults to checking overall AI availability.
 */
export function isFeatureEnabled(feature) {
  const env = getEnv();
  const requiredKeys = FEATURE_ENV_REQUIREMENTS[feature];
  if (!requiredKeys) {
    return isAiEnabled();
  }
  return requiredKeys.every((key) => isValidApiKey(env[key]));
}

/**
 * Throws an error if a specific AI feature is disabled.
 */
export function assertFeatureEnabled(feature) {
  if (!isFeatureEnabled(feature)) {
    throw new Error(
      `AI Feature Gating: Feature '${feature}' is disabled because the required environment variables (${
        FEATURE_ENV_REQUIREMENTS[feature]?.join(", ") || "GEMINI_API_KEY"
      }) are not configured.`
    );
  }
}
