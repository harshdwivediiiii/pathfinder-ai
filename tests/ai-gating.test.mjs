import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("AI Feature Gating", () => {
  beforeEach(() => {
    vi.resetModules();
    // Stub environments to control tests cleanly
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should report general AI as enabled when GEMINI_API_KEY is configured", async () => {
    const { isAiEnabled } = await import("../lib/ai-gating.js");
    expect(isAiEnabled()).toBe(true);
  });

  it("should report general AI as disabled when GEMINI_API_KEY is empty or missing", async () => {
    const { isAiEnabled } = await import("../lib/ai-gating.js");
    
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isAiEnabled()).toBe(false);

    vi.stubEnv("GEMINI_API_KEY", "  ");
    expect(isAiEnabled()).toBe(false);
  });

  it("should return correct status for mapped features based on GEMINI_API_KEY", async () => {
    const { isFeatureEnabled } = await import("../lib/ai-gating.js");

    // All features require GEMINI_API_KEY
    expect(isFeatureEnabled("chat")).toBe(true);
    expect(isFeatureEnabled("ats")).toBe(true);
    expect(isFeatureEnabled("coverLetter")).toBe(true);
    expect(isFeatureEnabled("roadmap")).toBe(true);

    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isFeatureEnabled("chat")).toBe(false);
    expect(isFeatureEnabled("ats")).toBe(false);
    expect(isFeatureEnabled("coverLetter")).toBe(false);
    expect(isFeatureEnabled("roadmap")).toBe(false);
  });

  it("should fallback to general AI check for unknown features", async () => {
    const { isFeatureEnabled } = await import("../lib/ai-gating.js");
    
    expect(isFeatureEnabled("someUnknownFeature")).toBe(true);

    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isFeatureEnabled("someUnknownFeature")).toBe(false);
  });

  it("should assert feature enablement correctly by throwing when key is missing", async () => {
    const { assertFeatureEnabled } = await import("../lib/ai-gating.js");

    expect(() => assertFeatureEnabled("chat")).not.toThrow();

    vi.stubEnv("GEMINI_API_KEY", "");
    expect(() => assertFeatureEnabled("chat")).toThrow(/disabled because the required environment variables/);
  });

  it("should enforce feature gating inside the Gemini client", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { generateGeminiContent } = await import("../lib/gemini.js");

    await expect(generateGeminiContent("test")).rejects.toThrow("GEMINI_API_KEY is not configured");
  });
});
