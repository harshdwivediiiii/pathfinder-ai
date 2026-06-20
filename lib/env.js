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

    if (process.env.NODE_ENV === "production") {
      console.error("[env] Invalid environment variables:", formatted);
      throw new Error("Invalid server environment configuration");
    }
  }

  const partialParsed = envSchema.partial().safeParse(process.env);
  const env = parsed.success
    ? parsed.data
    : {
        ...(partialParsed.success ? partialParsed.data : {}),
        ...process.env,
      };
  validateClerkKeys(env);

  if (env.NODE_ENV === "production") {
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
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required in production. AI features will fail if this is missing.");
    }
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
