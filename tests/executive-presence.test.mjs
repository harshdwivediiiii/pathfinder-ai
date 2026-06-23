import { describe, expect, it, vi, beforeEach } from "vitest";

import { executivePresenceOutputSchema, SCHEMA_DESCRIPTIONS } from "../lib/schemas/outputs.js";
import { validateOutput } from "../lib/validate.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

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

vi.mock("@/lib/prisma", () => ({
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

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

vi.mock("@/lib/rate-limit-actions", () => ({
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
          personaSummary: "A decisive and highly authoritative leader who commands attention.",
          communicationUpgrades: [{ from: "I think we might...", to: "I recommend we...", why: "Using declarative recommendations projects confidence and clarity." }],
          meetingStrategy: ["Pre-wire key stakeholders before meetings"],
          gravitasBuilders: ["Practice purposeful power pauses"]
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
