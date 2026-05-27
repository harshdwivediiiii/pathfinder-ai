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
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/onboarding"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/onboarding"),
});

let cachedEnv = null;

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
    console.error("[env] Invalid environment variables:", formatted);

    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid server environment configuration");
    }
  }

  const env = parsed.success ? parsed.data : envSchema.parse({ ...process.env });

  if (env.NODE_ENV === "production") {
    if (
      env.DATABASE_URL.includes("neon.tech") &&
      !env.DATABASE_URL.includes("-pooler.")
    ) {
      console.warn(
        "[env] DATABASE_URL points to Neon without the pooled host. Use the pooled connection string on Vercel to reduce connection failures."
      );
    }
    if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.CLERK_SECRET_KEY) {
      console.warn(
        "[env] WARNING: CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are not configured. This is normal during builds, but required at runtime in production."
      );
    }
    if (!env.GEMINI_API_KEY) {
      console.warn("[env] GEMINI_API_KEY is not set — AI features will fail");
    }
  }

  cachedEnv = env;
  return env;
}

/** Whether Clerk is configured with real keys (not keyless dev mode). */
export function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
  );
}
