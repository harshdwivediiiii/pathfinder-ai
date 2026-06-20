import { describe, expect, it, vi, beforeEach } from "vitest";

import { sideHustleIdeaOutputSchema, SCHEMA_DESCRIPTIONS } from "../lib/schemas/outputs.js";
import { validateOutput } from "../lib/validate.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

// ── Output Schema Validation ───────────────────────────────────────────────

describe("sideHustleIdeaOutputSchema", () => {
  it("accepts valid side hustle idea output", () => {
    const raw = JSON.stringify({
      ideas: [
        {
          name: "Freelance React Dev",
          description: "Build landing pages for local businesses using React.",
          targetAudience: "Local mom and pop shops.",
          pricingStrategy: "$500 per landing page.",
          firstStep: "Email 5 local businesses today."
        }
      ]
    });
    const result = validateOutput(sideHustleIdeaOutputSchema, raw);
    expect(result.success).toBe(true);
    expect(result.data.ideas).toHaveLength(1);
    expect(result.data.ideas[0].name).toBe("Freelance React Dev");
  });

  it("rejects output missing required fields", () => {
    const raw = JSON.stringify({
      ideas: [
        {
          name: "Idea 1"
        }
      ]
    });
    const result = validateOutput(sideHustleIdeaOutputSchema, raw);
    expect(result.success).toBe(false);
  });
});

// ── SCHEMA_DESCRIPTIONS ────────────────────────────────────────────────────

describe("SCHEMA_DESCRIPTIONS.sideHustleIdea", () => {
  it("buildFormatCorrectionPrompt includes side hustle idea schema description", () => {
    const prompt = buildFormatCorrectionPrompt(
      "Create an idea.",
      "This is not JSON",
      SCHEMA_DESCRIPTIONS.sideHustleIdea
    );
    expect(prompt).toContain("pricingStrategy");
  });
});

// ── Server Action ──────────────────────────────────────────────────────────

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  sideHustleIdeaCreate: vi.fn(),
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
    sideHustleIdea: {
      create: actionMocks.sideHustleIdeaCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

describe("generateSideHustles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates side hustle ideas successfully", async () => {
    const { generateSideHustles } = await import("../actions/side-hustle.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.findUnique.mockResolvedValueOnce({
      id: "db-user-1",
      clerkUserId: "user-1",
    });
    actionMocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          ideas: [
            {
              name: "Idea 1",
              description: "Desc",
              targetAudience: "Audience",
              pricingStrategy: "Strategy",
              firstStep: "Step"
            }
          ]
        }),
      },
    });
    actionMocks.sideHustleIdeaCreate.mockResolvedValue({ id: "hustle-1" });

    const result = await generateSideHustles("Coding", "Gaming");

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.sideHustleIdeaCreate).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.id).toBe("hustle-1");
  });
});
