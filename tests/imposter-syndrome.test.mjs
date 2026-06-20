import { describe, expect, it, vi, beforeEach } from "vitest";

import { imposterSyndromeOutputSchema, SCHEMA_DESCRIPTIONS } from "../lib/schemas/outputs.js";
import { validateOutput } from "../lib/validate.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

// ── Output Schema Validation ───────────────────────────────────────────────

describe("imposterSyndromeOutputSchema", () => {
  it("accepts valid imposter syndrome output", () => {
    const raw = JSON.stringify({
      empathyStatement: "It is completely normal to feel this way, especially when you are taking on new responsibilities and stepping out of your comfort zone.",
      cognitiveReframes: [
        {
          theDoubt: "I only got this promotion because I was in the right place at the right time.",
          theReality: "You secured this promotion because you consistently delivered high-quality work, effectively managed complex projects, and demonstrated strong leadership skills."
        }
      ],
      powerMantra: "I have earned my place through hard work and proven capabilities.",
      actionableAdvice: "Write down three specific contributions you made this week and review them before your next team meeting."
    });
    const result = validateOutput(imposterSyndromeOutputSchema, raw);
    expect(result.success).toBe(true);
    expect(result.data.cognitiveReframes).toHaveLength(1);
    expect(result.data.empathyStatement).toContain("normal to feel");
  });

  it("rejects output missing required fields", () => {
    const raw = JSON.stringify({
      empathyStatement: "I hear you."
    });
    const result = validateOutput(imposterSyndromeOutputSchema, raw);
    expect(result.success).toBe(false);
  });
});

// ── SCHEMA_DESCRIPTIONS ────────────────────────────────────────────────────

describe("SCHEMA_DESCRIPTIONS.imposterSyndrome", () => {
  it("buildFormatCorrectionPrompt includes imposter syndrome schema description", () => {
    const prompt = buildFormatCorrectionPrompt(
      "Reframe thoughts.",
      "This is not JSON",
      SCHEMA_DESCRIPTIONS.imposterSyndrome
    );
    expect(prompt).toContain("powerMantra");
  });
});

// ── Server Action ──────────────────────────────────────────────────────────

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  imposterSyndromeCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: actionMocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    user: {
      findUnique: actionMocks.findUnique,
    },
    imposterSyndrome: {
      create: actionMocks.imposterSyndromeCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("reframeThoughts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates cognitive reframes successfully", async () => {
    const { reframeThoughts } = await import("../actions/imposter-syndrome.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.findUnique.mockResolvedValueOnce({
      id: "db-user-1",
      clerkUserId: "user-1",
    });
    actionMocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          empathyStatement: "It's normal.",
          cognitiveReframes: [
            { theDoubt: "Doubt", theReality: "Reality" }
          ],
          powerMantra: "Mantra",
          actionableAdvice: "Advice"
        }),
      },
    });
    actionMocks.imposterSyndromeCreate.mockResolvedValue({ id: "imposter-1" });

    const result = await reframeThoughts("I am a fraud", "I built an app");

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.imposterSyndromeCreate).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.id).toBe("imposter-1");
  });
});
