import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine((value) => /^postgres(ql)?:\/\//.test(value), {
      message: "DATABASE_URL must be a PostgreSQL connection string",
    }),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  REDIS_URL: z.string().min(1).optional(),
  RATE_LIMIT_STORE: z.enum(["auto", "memory", "redis"]).default("auto"),
  RATE_LIMIT_REDIS_PREFIX: z.string().min(1).default("pathfinder:rate-limit"),
  RATE_LIMIT_FAIL_OPEN: z
    .string()
    .optional()
    .transform((value) => value === "true" || value === "1"),
  CACHE_STORE: z.enum(["auto", "memory", "redis"]).default("auto"),
  CACHE_REDIS_PREFIX: z.string().min(1).default("pathfinder:cache"),
  CACHE_TTL_MS: z.coerce.number().positive().default(600000),
  TRUSTED_PROXY_COUNT: z.coerce.number().int().nonnegative().default(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/onboarding"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/onboarding"),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

let cachedEnv = null;

/**
 * Resets the cached environment configuration.
 * Intended for testing purposes to ensure environment variable changes are reflected.
 */
export function resetEnvCache() {
  cachedEnv = null;
}

function getClerkKeyMode(key) {
  return key?.match(/^(?:pk|sk)_(test|live)_/)?.[1] ?? null;
}

function validateClerkKeys(env) {
  const publishableKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = env.CLERK_SECRET_KEY;

  const hasPublishable = publishableKey && publishableKey.trim() !== "" && publishableKey !== "undefined" && publishableKey !== "null";
  const hasSecret = secretKey && secretKey.trim() !== "" && secretKey !== "undefined" && secretKey !== "null";

  if (!hasPublishable || !hasSecret) {
    return;
  }

  const publishableMode = getClerkKeyMode(publishableKey);
  const secretMode = getClerkKeyMode(secretKey);

  if (!publishableMode || !secretMode || publishableMode !== secretMode) {
    throw new Error(
      "Invalid Clerk configuration: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY must both be valid keys from the same test/live Clerk instance."
    );
  }
}

/**
 * Validates that a required environment variable is present and non-empty.
 * Rejects empty strings, "undefined", and "null" string values.
 *
 * @param {string} value - The environment variable value
 * @param {string} name - The environment variable name for error messages
 * @returns {boolean} True if the value is valid
 * @throws {Error} If the value is invalid
 */
export function validateRequiredEnvVar(value, name) {
  const isValid = value && value.trim() !== "" && value !== "undefined" && value !== "null";
  if (!isValid) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return true;
}

/**
 * Validates Inngest configuration for production.
 * Both INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are required in production.
 *
 * @param {object} env - The parsed environment object
 * @throws {Error} If Inngest configuration is invalid in production
 */
export function validateInngestConfig(env) {
  const eventKey = env.INNGEST_EVENT_KEY;
  const signingKey = env.INNGEST_SIGNING_KEY;

  const hasEventKey = eventKey && eventKey.trim() !== "" && eventKey !== "undefined" && eventKey !== "null";
  const hasSigningKey = signingKey && signingKey.trim() !== "" && signingKey !== "undefined" && signingKey !== "null";

  if (!hasEventKey || !hasSigningKey) {
    throw new Error(
      "Missing Inngest configuration.\n\n" +
      "INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are required in production for background job processing.\n\n" +
      "Configure both environment variables before deploying the application.\n" +
      "Get your keys from: https://app.inngest.com → your app → Manage"
    );
  }
}

/**
 * Validates environment variables at runtime.
 * In production, Clerk keys are required for secure auth.
 */
export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;

    if (process.env.NODE_ENV === "production" && process.env.npm_lifecycle_event !== "build" && process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("[env] Invalid environment variables:", formatted);
      throw new Error("Invalid server environment configuration");
    }
  }

  if (!parsed.success) {
    const partial = envSchema.partial().safeParse(process.env);
    if (partial.success) {
      cachedEnv = { ...envSchema.parse({}), ...partial.data };
    } else {
      cachedEnv = envSchema.parse({});
    }
    return cachedEnv;
  }
  const env = parsed.data;
  validateClerkKeys(env);

  const isBuild = process.env.npm_lifecycle_event === "build" || process.env.NEXT_PHASE === "phase-production-build" || process.env.CI === "true";
  
  if (env.NODE_ENV === "production" && !isBuild) {
    if (env.RATE_LIMIT_STORE === "memory") {
      throw new Error(
        "RATE_LIMIT_STORE=memory is not allowed in production. Configure REDIS_URL and use RATE_LIMIT_STORE=auto or RATE_LIMIT_STORE=redis."
      );
    }
    if (!env.REDIS_URL) {
      throw new Error(
        "REDIS_URL is required in production for shared rate limiting."
      );
    }

    if (
      env.DATABASE_URL.includes("neon.tech") &&
      !env.DATABASE_URL.includes("-pooler.")
    ) {
      console.warn(
        "[env] DATABASE_URL points to Neon without the pooled host. Use the pooled connection string on Vercel to reduce connection failures."
      );
    }
    const pk = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const sk = env.CLERK_SECRET_KEY;
    const hasPublishable = pk && pk.trim() !== "" && pk !== "undefined" && pk !== "null";
    const hasSecret = sk && sk.trim() !== "" && sk !== "undefined" && sk !== "null";

    if (!hasPublishable || !hasSecret) {
      throw new Error(
        "Missing Clerk configuration: CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are required in production."
      );
    }
    const geminiKey = env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.trim() === "" || geminiKey === "undefined" || geminiKey === "null") {
      throw new Error("GEMINI_API_KEY is required and must be a valid key in production. AI features will fail if this is missing or malformed.");
    }
    validateInngestConfig(env);
  }

  cachedEnv = env;
  return env;
}

/** Whether Clerk is configured with real keys (not keyless dev mode). */
export function isClerkConfigured() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  const hasPublishable = pk && pk.trim() !== "" && pk !== "undefined" && pk !== "null";
  const hasSecret = sk && sk.trim() !== "" && sk !== "undefined" && sk !== "null";
  return Boolean(hasPublishable && hasSecret);
}
