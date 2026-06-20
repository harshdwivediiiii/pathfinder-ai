import { describe, expect, it, vi, beforeEach } from "vitest";

import { managerReadmeOutputSchema, SCHEMA_DESCRIPTIONS } from "../lib/schemas/outputs.js";
import { validateOutput } from "../lib/validate.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

// ── Output Schema Validation ───────────────────────────────────────────────

describe("managerReadmeOutputSchema", () => {
  it("accepts valid manager readme output", () => {
    const raw = JSON.stringify({
      readmeMarkdown: "# Working with Me\n\n## My Role\nI am the Engineering Manager for the Core Product team.\n\n## Communication Style\nI prefer async communication via Slack for non-urgent matters. If it's urgent, please call me.\n\n## Boundaries & Quirks\nI do not check Slack after 6 PM on weekdays or at all on weekends.\n\n## How I give and receive feedback\nI believe in radical candor and will give feedback directly and privately."
    });
    const result = validateOutput(managerReadmeOutputSchema, raw);
    expect(result.success).toBe(true);
    expect(result.data.readmeMarkdown).toContain("Working with Me");
  });

  it("rejects output missing required fields", () => {
    const raw = JSON.stringify({
      otherField: "This is wrong"
    });
    const result = validateOutput(managerReadmeOutputSchema, raw);
    expect(result.success).toBe(false);
  });
});

// ── SCHEMA_DESCRIPTIONS ────────────────────────────────────────────────────

describe("SCHEMA_DESCRIPTIONS.managerReadme", () => {
  it("buildFormatCorrectionPrompt includes manager readme schema description", () => {
    const prompt = buildFormatCorrectionPrompt(
      "Create a readme.",
      "This is not JSON",
      SCHEMA_DESCRIPTIONS.managerReadme
    );
    expect(prompt).toContain("readmeMarkdown");
  });
});

// ── Server Action ──────────────────────────────────────────────────────────

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  managerReadmeCreate: vi.fn(),
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
    managerReadme: {
      create: actionMocks.managerReadmeCreate,
    },
  },
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: actionMocks.generateGeminiContent,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("buildReadme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates manager readme successfully", async () => {
    const { buildReadme } = await import("../actions/manager-readme.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.findUnique.mockResolvedValueOnce({
      id: "db-user-1",
      clerkUserId: "user-1",
    });
    actionMocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          readmeMarkdown: "# My Readme\nI am great."
        }),
      },
    });
    actionMocks.managerReadmeCreate.mockResolvedValue({ id: "readme-1" });

    const result = await buildReadme("Direct", "No weekends", "Public praise");

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.managerReadmeCreate).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.id).toBe("readme-1");
  });
});
