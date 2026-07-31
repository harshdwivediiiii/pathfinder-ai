import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("Environment Validation", () => {
  beforeEach(() => {
    vi.resetModules();
    // Set base required environment variables
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_123");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_123");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Development Mode - Inngest Optional", () => {
    it("should allow missing Inngest keys in development", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("INNGEST_EVENT_KEY", "");
      vi.stubEnv("INNGEST_SIGNING_KEY", "");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).not.toThrow();
    });

    it("should allow valid Inngest keys in development", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("INNGEST_EVENT_KEY", "local");
      vi.stubEnv("INNGEST_SIGNING_KEY", "local");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).not.toThrow();
    });

    it("should allow undefined Inngest keys in development", async () => {
      vi.stubEnv("NODE_ENV", "development");
      delete process.env.INNGEST_EVENT_KEY;
      delete process.env.INNGEST_SIGNING_KEY;

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).not.toThrow();
    });
  });

  describe("Production Mode - Inngest Required", () => {
    it("should require both Inngest keys in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).not.toThrow();
    });

    it("should throw when INNGEST_EVENT_KEY is missing in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when INNGEST_SIGNING_KEY is missing in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when both Inngest keys are missing in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "");
      vi.stubEnv("INNGEST_SIGNING_KEY", "");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when INNGEST_EVENT_KEY is undefined string in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "undefined");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when INNGEST_SIGNING_KEY is undefined string in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "undefined");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when INNGEST_EVENT_KEY is null string in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "null");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when INNGEST_SIGNING_KEY is null string in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "null");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when INNGEST_EVENT_KEY is whitespace only in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "   ");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when INNGEST_SIGNING_KEY is whitespace only in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "   ");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Inngest configuration/);
    });

    it("should provide descriptive error message for missing Inngest configuration", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("INNGEST_EVENT_KEY", "");
      vi.stubEnv("INNGEST_SIGNING_KEY", "");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are required in production/);
      expect(() => getEnv()).toThrow(/background job processing/);
      expect(() => getEnv()).toThrow(/https:\/\/app.inngest.com/);
    });
  });

  describe("validateRequiredEnvVar Helper", () => {
    it("should validate non-empty string", async () => {
      const { validateRequiredEnvVar } = await import("@/lib/security/env");
      expect(() => validateRequiredEnvVar("valid-value", "TEST_VAR")).not.toThrow();
    });

    it("should throw for empty string", async () => {
      const { validateRequiredEnvVar } = await import("@/lib/security/env");
      expect(() => validateRequiredEnvVar("", "TEST_VAR")).toThrow(/Missing required environment variable: TEST_VAR/);
    });

    it("should throw for undefined string", async () => {
      const { validateRequiredEnvVar } = await import("@/lib/security/env");
      expect(() => validateRequiredEnvVar("undefined", "TEST_VAR")).toThrow(/Missing required environment variable: TEST_VAR/);
    });

    it("should throw for null string", async () => {
      const { validateRequiredEnvVar } = await import("@/lib/security/env");
      expect(() => validateRequiredEnvVar("null", "TEST_VAR")).toThrow(/Missing required environment variable: TEST_VAR/);
    });

    it("should throw for whitespace only", async () => {
      const { validateRequiredEnvVar } = await import("@/lib/security/env");
      expect(() => validateRequiredEnvVar("   ", "TEST_VAR")).toThrow(/Missing required environment variable: TEST_VAR/);
    });

    it("should throw for undefined value", async () => {
      const { validateRequiredEnvVar } = await import("@/lib/security/env");
      expect(() => validateRequiredEnvVar(undefined, "TEST_VAR")).toThrow(/Missing required environment variable: TEST_VAR/);
    });

    it("should throw for null value", async () => {
      const { validateRequiredEnvVar } = await import("@/lib/security/env");
      expect(() => validateRequiredEnvVar(null, "TEST_VAR")).toThrow(/Missing required environment variable: TEST_VAR/);
    });
  });

  describe("validateInngestConfig Helper", () => {
    it("should validate when both keys are present", async () => {
      const { validateInngestConfig } = await import("@/lib/security/env");
      const env = {
        INNGEST_EVENT_KEY: "event-key",
        INNGEST_SIGNING_KEY: "signing-key",
      };
      expect(() => validateInngestConfig(env)).not.toThrow();
    });

    it("should throw when event key is missing", async () => {
      const { validateInngestConfig } = await import("@/lib/security/env");
      const env = {
        INNGEST_EVENT_KEY: "",
        INNGEST_SIGNING_KEY: "signing-key",
      };
      expect(() => validateInngestConfig(env)).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when signing key is missing", async () => {
      const { validateInngestConfig } = await import("@/lib/security/env");
      const env = {
        INNGEST_EVENT_KEY: "event-key",
        INNGEST_SIGNING_KEY: "",
      };
      expect(() => validateInngestConfig(env)).toThrow(/Missing Inngest configuration/);
    });

    it("should throw when both keys are missing", async () => {
      const { validateInngestConfig } = await import("@/lib/security/env");
      const env = {
        INNGEST_EVENT_KEY: "",
        INNGEST_SIGNING_KEY: "",
      };
      expect(() => validateInngestConfig(env)).toThrow(/Missing Inngest configuration/);
    });
  });

  describe("Backward Compatibility - Existing Validations", () => {
    it("should still validate DATABASE_URL in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DATABASE_URL", "invalid-url");
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow();
    });

    it("should still validate REDIS_URL in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.REDIS_URL;
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/REDIS_URL is required in production/);
    });

    it("should still validate GEMINI_API_KEY in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.GEMINI_API_KEY;
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/GEMINI_API_KEY.*required.*production/);
    });

    it("should still validate Clerk keys in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.CLERK_SECRET_KEY;
      vi.stubEnv("INNGEST_EVENT_KEY", "prod-event-key");
      vi.stubEnv("INNGEST_SIGNING_KEY", "prod-signing-key");

      const { getEnv } = await import("@/lib/security/env");
      expect(() => getEnv()).toThrow(/Missing Clerk configuration/);
    });
  });
});
