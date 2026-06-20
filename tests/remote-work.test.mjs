import { describe, expect, it, vi, beforeEach } from "vitest";

import { remoteWorkPitchOutputSchema, SCHEMA_DESCRIPTIONS } from "../lib/schemas/outputs.js";
import { validateOutput } from "../lib/validate.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

// ── Output Schema Validation ───────────────────────────────────────────────

describe("remoteWorkPitchOutputSchema", () => {
  it("accepts valid remote work pitch output", () => {
    const raw = JSON.stringify({
      businessCase: [
        "Increased focus time by eliminating a 2-hour daily commute.",
        "Better timezone alignment with the offshore engineering team.",
        "Proven track record of high productivity during previous remote days."
      ],
      counterObjections: [
        {
          objection: "We need you in the office for spontaneous collaboration.",
          rebuttal: "I will establish dedicated core hours for sync communication and maintain active presence on Slack/Zoom."
        }
      ],
      writtenProposal: "Dear Manager, I would like to formally request a transition to a remote work schedule...",
      verbalScript: "Hi Manager, thanks for making time. I wanted to discuss my current working arrangement..."
    });
    const result = validateOutput(remoteWorkPitchOutputSchema, raw);
    expect(result.success).toBe(true);
    expect(result.data.businessCase).toHaveLength(3);
    expect(result.data.counterObjections).toHaveLength(1);
    expect(result.data.writtenProposal).toContain("Dear Manager");
  });

  it("rejects output missing required fields", () => {
    const raw = JSON.stringify({
      businessCase: ["Just one point"]
      // Missing counterObjections, writtenProposal, verbalScript
    });
    const result = validateOutput(remoteWorkPitchOutputSchema, raw);
    expect(result.success).toBe(false);
  });
});

// ── SCHEMA_DESCRIPTIONS ────────────────────────────────────────────────────

describe("SCHEMA_DESCRIPTIONS.remoteWorkPitch", () => {
  it("buildFormatCorrectionPrompt includes remote work pitch schema description", () => {
    const prompt = buildFormatCorrectionPrompt(
      "Create a pitch.",
      "This is not JSON",
      SCHEMA_DESCRIPTIONS.remoteWorkPitch
    );
    expect(prompt).toContain("businessCase");
  });
});

// ── Server Action ──────────────────────────────────────────────────────────

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  remoteWorkPitchCreate: vi.fn(),
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
    remoteWorkPitch: {
      create: actionMocks.remoteWorkPitchCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

describe("generateRemotePitch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates remote work pitch successfully", async () => {
    const { generateRemotePitch } = await import("../actions/remote-work.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.findUnique.mockResolvedValueOnce({
      id: "db-user-1",
      clerkUserId: "user-1",
    });
    actionMocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          businessCase: ["Point 1"],
          counterObjections: [
            { objection: "Obj 1", rebuttal: "Rebuttal 1" }
          ],
          writtenProposal: "Proposal",
          verbalScript: "Script"
        }),
      },
    });
    actionMocks.remoteWorkPitchCreate.mockResolvedValue({ id: "pitch-1" });

    const result = await generateRemotePitch("Software Engineer", "Long commute", "Fear of low productivity");

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.remoteWorkPitchCreate).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.id).toBe("pitch-1");
  });
});
