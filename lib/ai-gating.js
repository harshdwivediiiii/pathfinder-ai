import "server-only";

const FEATURE_ENV_REQUIREMENTS = {
  chat: ["GEMINI_API_KEY"],
  ats: ["GEMINI_API_KEY"],
  coverLetter: ["GEMINI_API_KEY"],
  interview: ["GEMINI_API_KEY"],
  roadmap: ["GEMINI_API_KEY"],
  insights: ["GEMINI_API_KEY"],
};

/**
 * Checks if the general AI capability is enabled.
 * Returns true if GEMINI_API_KEY is configured.
 */
export function isAiEnabled() {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey.trim() !== "");
}

/**
 * Checks if a specific AI feature is enabled based on required environment keys.
 * If the feature is not configured in FEATURE_ENV_REQUIREMENTS, defaults to checking overall AI availability.
 */
export function isFeatureEnabled(feature) {
  const requiredKeys = FEATURE_ENV_REQUIREMENTS[feature];
  if (!requiredKeys) {
    return isAiEnabled();
  }
  return requiredKeys.every((key) => {
    const val = process.env[key];
    return Boolean(val && val.trim() !== "");
  });
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
