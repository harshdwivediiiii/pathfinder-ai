import { describe, expect, it, vi, beforeEach } from "vitest";

import { executivePresenceOutputSchema, SCHEMA_DESCRIPTIONS } from "@/lib/schemas/outputs.js";
import { validateOutput } from "@/lib/ai/validate.js";
import { buildFormatCorrectionPrompt } from "@/lib/ai/prompt-safety.js";

// ── Output Schema Validation ───────────────────────────────────────────────

describe("executivePresenceOutputSchema", () => {
  it("accepts valid executive presence output", () => {
    const raw = JSON.stringify({
      personaSummary: "A confident and decisive leader.",
      communicationUpgrades: [
        {
          from: "I think we should...",
          to: "I recommend we...",
          why: "It sounds more authoritative."
        }
      ],
      meetingStrategy: ["Pre-wire key stakeholders", "Open with the bottom line"],
      gravitasBuilders: ["Practice the power pause"]
    });
    const result = validateOutput(executivePresenceOutputSchema, raw);
    expect(result.success).toBe(true);
    expect(result.data.personaSummary).toBeTruthy();
    expect(result.data.communicationUpgrades).toHaveLength(1);
    expect(result.data.meetingStrategy).toHaveLength(2);
    expect(result.data.gravitasBuilders).toHaveLength(1);
  });

  it("rejects output missing required fields", () => {
    const raw = JSON.stringify({
      personaSummary: "A confident leader."
    });
    const result = validateOutput(executivePresenceOutputSchema, raw);
    expect(result.success).toBe(false);
  });
});

// ── SCHEMA_DESCRIPTIONS ────────────────────────────────────────────────────

describe("SCHEMA_DESCRIPTIONS.executivePresence", () => {
  it("buildFormatCorrectionPrompt includes executive presence schema description", () => {
    const prompt = buildFormatCorrectionPrompt(
      "Create a plan.",
      "This is not JSON",
      SCHEMA_DESCRIPTIONS.executivePresence
    );
    expect(prompt).toContain("personaSummary");
    expect(prompt).toContain("gravitasBuilders");
  });
});

// ── Server Action ──────────────────────────────────────────────────────────

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  executivePresenceFindMany: vi.fn(),
  executivePresenceCreate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: actionMocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: actionMocks.findUnique,
    },
    executivePresence: {
      findMany: actionMocks.executivePresenceFindMany,
      create: actionMocks.executivePresenceCreate,
    },
  },
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

vi.mock("@/lib/security/rate-limit-actions.js", () => ({
  checkRateLimit: actionMocks.checkRateLimit,
  formatResetTime: actionMocks.formatResetTime,
}));

describe("generateExecutivePresence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates an executive presence plan successfully", async () => {
    const { generateExecutivePresence } = await import("../actions/executive-presence.js");

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
          personaSummary: "A highly confident and structured executive presence brand that projects authority and domain expertise.",
          communicationUpgrades: [
            { 
              from: "I just think maybe", 
              to: "I strongly recommend", 
              why: "Eliminates hedging language and projects executive confidence." 
            }
          ],
          meetingStrategy: ["Establish pre-meeting alignment with key board stakeholders."],
          gravitasBuilders: ["Practice deliberate pausing during high-stakes client pitches."]
        }),
      },
    });
    actionMocks.executivePresenceCreate.mockResolvedValue({ id: "plan-1" });

    const formData = new FormData();
    formData.append("targetAudience", "Board");
    formData.append("currentChallenge", "Nervous");

    const result = await generateExecutivePresence(formData);

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.checkRateLimit).toHaveBeenCalledWith("user-1", "executive_presence");
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.executivePresenceCreate).toHaveBeenCalled();
    expect(result.id).toBe("plan-1");
  });
});
