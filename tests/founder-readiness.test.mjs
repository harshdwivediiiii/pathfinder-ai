import { describe, expect, it, vi, beforeEach } from "vitest";

import { founderReadinessOutputSchema, SCHEMA_DESCRIPTIONS } from "../lib/schemas/outputs.js";
import { validateOutput } from "../lib/validate.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

// ── Output Schema Validation ───────────────────────────────────────────────

describe("founderReadinessOutputSchema", () => {
  it("accepts valid founder readiness output", () => {
    const raw = JSON.stringify({
      founderScore: 85,
      strengths: ["Resilience", "Domain Expertise"],
      blindSpots: [
        {
          issue: "Lack of technical co-founder",
          mitigation: "Start networking at tech events"
        }
      ],
      businessIdeaFeedback: "The idea is sound but needs a clearer go-to-market strategy.",
      ninetyDayRoadmap: [
        { phase: "Month 1", actionItems: ["Validate problem"] },
        { phase: "Month 2", actionItems: ["Build MVP"] },
        { phase: "Month 3", actionItems: ["Launch to beta"] }
      ]
    });
    const result = validateOutput(founderReadinessOutputSchema, raw);
    expect(result.success).toBe(true);
    expect(result.data.founderScore).toBe(85);
    expect(result.data.strengths).toHaveLength(2);
    expect(result.data.blindSpots).toHaveLength(1);
    expect(result.data.ninetyDayRoadmap).toHaveLength(3);
  });

  it("rejects output missing required fields", () => {
    const raw = JSON.stringify({
      founderScore: 90,
      strengths: ["Visionary"]
    });
    const result = validateOutput(founderReadinessOutputSchema, raw);
    expect(result.success).toBe(false);
  });
});

// ── SCHEMA_DESCRIPTIONS ────────────────────────────────────────────────────

describe("SCHEMA_DESCRIPTIONS.founderReadiness", () => {
  it("buildFormatCorrectionPrompt includes founder readiness schema description", () => {
    const prompt = buildFormatCorrectionPrompt(
      "Create a founder plan.",
      "This is not JSON",
      SCHEMA_DESCRIPTIONS.founderReadiness
    );
    expect(prompt).toContain("founderScore");
    expect(prompt).toContain("ninetyDayRoadmap");
  });
});

// ── Server Action ──────────────────────────────────────────────────────────

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  founderReadinessFindMany: vi.fn(),
  founderReadinessCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: actionMocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: actionMocks.findUnique,
    },
    founderReadiness: {
      findMany: actionMocks.founderReadinessFindMany,
      create: actionMocks.founderReadinessCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

vi.mock("@/lib/rate-limit-actions", () => ({
  checkRateLimit: actionMocks.checkRateLimit,
  formatResetTime: actionMocks.formatResetTime,
}));

describe("generateFounderReadiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a founder readiness plan successfully", async () => {
    const { generateFounderReadiness } = await import("../actions/founder-readiness.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: true });
    actionMocks.findUnique.mockResolvedValueOnce({
      id: "db-user-1",
      clerkUserId: "user-1",
      name: "Test User",
    });
    actionMocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          founderScore: 90,
          strengths: ["Resilience", "Industry Domain Knowledge"],
          blindSpots: [{ issue: "Lack of direct sales experience", mitigation: "Partner with or hire a sales co-founder" }],
          businessIdeaFeedback: "The business idea is highly viable and has clear market demand.",
          ninetyDayRoadmap: [
            { phase: "Month 1", actionItems: ["Conduct user research"] },
            { phase: "Month 2", actionItems: ["Build prototype MVP"] },
            { phase: "Month 3", actionItems: ["Launch beta product"] }
          ]
        }),
      },
    });
    actionMocks.founderReadinessCreate.mockResolvedValue({ id: "plan-1" });

    const formData = new FormData();
    formData.append("businessIdea", "AI Coach");
    formData.append("riskTolerance", "High");
    formData.append("skills", "Coding");

    const result = await generateFounderReadiness(formData);

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.checkRateLimit).toHaveBeenCalledWith("user-1", "founder_readiness");
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.founderReadinessCreate).toHaveBeenCalled();
    expect(result.id).toBe("plan-1");
  });
});
