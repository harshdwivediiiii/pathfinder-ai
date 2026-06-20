import { describe, expect, it, vi, beforeEach } from "vitest";

import { careerRoadmapOutputSchema, SCHEMA_DESCRIPTIONS } from "../lib/schemas/outputs.js";
import { validateOutput } from "../lib/validate.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

// ── Output Schema Validation ───────────────────────────────────────────────

describe("careerRoadmapOutputSchema", () => {
  it("accepts valid career roadmap output", () => {
    const raw = JSON.stringify({
      milestones: [
        {
          title: "Learn Core JavaScript",
          description: "Master JavaScript fundamentals including closures, promises, and async/await.",
          skillsToLearn: ["JavaScript", "Node.js basics"],
          estimatedDuration: "3-6 months",
          priority: "high",
        },
        {
          title: "Build Portfolio Projects",
          description: "Create 3 full-stack projects demonstrating your skills.",
          skillsToLearn: ["React", "Express", "PostgreSQL"],
          estimatedDuration: "6-9 months",
          priority: "high",
        },
        {
          title: "Network & Apply",
          description: "Build professional network and start applying for target roles.",
          skillsToLearn: ["LinkedIn optimization", "Interview preparation"],
          estimatedDuration: "3-6 months",
          priority: "medium",
        },
      ],
      totalEstimatedTime: "12-18 months",
      summary: "A comprehensive path from beginner to job-ready developer.",
    });
    const result = validateOutput(careerRoadmapOutputSchema, raw);
    expect(result.success).toBe(true);
    expect(result.data.milestones).toHaveLength(3);
    expect(result.data.totalEstimatedTime).toBeTruthy();
    expect(result.data.summary).toBeTruthy();
  });

  it("strips markdown fences before parsing", () => {
    const raw = "```json\n" + JSON.stringify({
      milestones: [
        {
          title: "Skill Assessment",
          description: "Evaluate current skills against target role requirements.",
          skillsToLearn: ["Self-assessment"],
          estimatedDuration: "1-2 months",
          priority: "high",
        },
        {
          title: "Skill Development",
          description: "Build required skills through structured learning paths.",
          skillsToLearn: ["Technical skills", "Soft skills"],
          estimatedDuration: "3-6 months",
          priority: "high",
        },
        {
          title: "Job Preparation",
          description: "Prepare resumes and practice interviewing.",
          skillsToLearn: ["Resume writing", "Mock interviews"],
          estimatedDuration: "1-3 months",
          priority: "medium",
        },
      ],
      totalEstimatedTime: "6-12 months",
      summary: "A focused roadmap for career transition.",
    }) + "\n```";
    const result = validateOutput(careerRoadmapOutputSchema, raw);
    expect(result.success).toBe(true);
  });

  it("rejects output with too few milestones", () => {
    const raw = JSON.stringify({
      milestones: [
        {
          title: "Learn Basics",
          description: "Build foundational knowledge in the field.",
          skillsToLearn: ["Fundamentals"],
          estimatedDuration: "3 months",
          priority: "high",
        },
      ],
      totalEstimatedTime: "3 months",
      summary: "Too short.",
    });
    const result = validateOutput(careerRoadmapOutputSchema, raw);
    expect(result.success).toBe(false);
  });

  it("rejects malformed JSON", () => {
    const result = validateOutput(careerRoadmapOutputSchema, "not json at all");
    expect(result.success).toBe(false);
    expect(result.errors._output[0]).toContain("valid JSON");
  });

  it("rejects empty string", () => {
    const result = validateOutput(careerRoadmapOutputSchema, "");
    expect(result.success).toBe(false);
    expect(result.errors._output[0]).toContain("empty");
  });

  it("rejects milestone with missing required fields", () => {
    const raw = JSON.stringify({
      milestones: [
        {
          title: "Learn Basics",
          description: "Some description.",
          skillsToLearn: ["Skill 1"],
          estimatedDuration: "3 months",
          priority: "high",
        },
        {
          title: "Another milestone",
          description: "Missing skillsToLearn",
          estimatedDuration: "2 months",
          priority: "medium",
        },
      ],
      totalEstimatedTime: "5 months",
      summary: "Incomplete.",
    });
    const result = validateOutput(careerRoadmapOutputSchema, raw);
    expect(result.success).toBe(false);
  });

  it("rejects milestone with invalid priority", () => {
    const raw = JSON.stringify({
      milestones: [
        {
          title: "Learn Basics",
          description: "Some description.",
          skillsToLearn: ["Skill 1"],
          estimatedDuration: "3 months",
          priority: "high",
        },
        {
          title: "Another milestone",
          description: "Some description here.",
          skillsToLearn: ["Skill 2"],
          estimatedDuration: "2 months",
          priority: "high",
        },
        {
          title: "Third milestone",
          description: "Description here.",
          skillsToLearn: ["Skill 3"],
          estimatedDuration: "1 month",
          priority: "invalid_priority",
        },
      ],
      totalEstimatedTime: "6 months",
      summary: "Invalid priority test.",
    });
    const result = validateOutput(careerRoadmapOutputSchema, raw);
    expect(result.success).toBe(false);
  });
});

// ── SCHEMA_DESCRIPTIONS ────────────────────────────────────────────────────

describe("SCHEMA_DESCRIPTIONS.careerRoadmap", () => {
  it("buildFormatCorrectionPrompt includes career roadmap schema description", () => {
    const prompt = buildFormatCorrectionPrompt(
      "Create a career roadmap.",
      "This is not JSON",
      SCHEMA_DESCRIPTIONS.careerRoadmap
    );
    expect(prompt).toContain("milestones");
    expect(prompt).toContain("totalEstimatedTime");
    expect(prompt).toContain("did not match the required JSON format");
  });
});

// ── Server Action ──────────────────────────────────────────────────────────

const actionMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  roadmapFindUnique: vi.fn(),
  upsert: vi.fn(),
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
    roadmap: {
      findUnique: actionMocks.roadmapFindUnique,
      upsert: actionMocks.upsert,
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("generateCareerRoadmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a career roadmap successfully", async () => {
    const { generateCareerRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: true });
    actionMocks.findUnique
      .mockResolvedValueOnce({
        id: "db-user-1",
        clerkUserId: "user-1",
        name: "Test User",
        currentRole: "Junior Developer",
        targetRole: "Senior Developer",
        careerGoals: "Become a tech lead",
        industry: "Technology",
        experience: 3,
        skills: ["JavaScript", "React"],
        bio: "A passionate developer.",
      });
    actionMocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          milestones: [
            {
              title: "Master Advanced JavaScript",
              description: "Deepen understanding of advanced JavaScript concepts.",
              skillsToLearn: ["TypeScript", "Design Patterns"],
              estimatedDuration: "3-6 months",
              priority: "high",
            },
            {
              title: "Lead Small Team",
              description: "Take ownership of a feature and mentor junior developers.",
              skillsToLearn: ["Code review", "Project planning"],
              estimatedDuration: "6-12 months",
              priority: "high",
            },
            {
              title: "Architecture Design",
              description: "Learn to design scalable system architectures.",
              skillsToLearn: ["System design", "Microservices"],
              estimatedDuration: "6-12 months",
              priority: "medium",
            },
          ],
          totalEstimatedTime: "18-24 months",
          summary: "Path from junior to senior developer.",
        }),
      },
    });
    actionMocks.upsert.mockResolvedValue({
      id: "roadmap-1",
      content: {
        milestones: [],
        totalEstimatedTime: "18-24 months",
        summary: "Path from junior to senior developer.",
      },
    });

    const result = await generateCareerRoadmap();

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.checkRateLimit).toHaveBeenCalledWith("user-1", "roadmap");
    expect(actionMocks.findUnique).toHaveBeenCalled();
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.upsert).toHaveBeenCalled();
    expect(result.id).toBe("roadmap-1");
  });

  it("throws on unauthorized access", async () => {
    const { generateCareerRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: null });

    await expect(generateCareerRoadmap()).rejects.toThrow("Unauthorized");
  });

  it("throws when rate limit is exceeded", async () => {
    const { generateCareerRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date(Date.now() + 3600000) });
    actionMocks.formatResetTime.mockReturnValue("60 minutes");

    await expect(generateCareerRoadmap()).rejects.toThrow("Roadmap generation limit reached");
  });

  it("throws when AI generation fails", async () => {
    const { generateCareerRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: true });
    actionMocks.findUnique
      .mockResolvedValueOnce({
        id: "db-user-1",
        clerkUserId: "user-1",
        name: "Test User",
        currentRole: "Junior Developer",
        targetRole: "Senior Developer",
        careerGoals: "Become a tech lead",
        industry: "Technology",
        experience: 3,
        skills: ["JavaScript", "React"],
        bio: "A passionate developer.",
      });
    actionMocks.generateGeminiContent.mockRejectedValue(new Error("AI service unavailable"));

    await expect(generateCareerRoadmap()).rejects.toThrow("AI returned an unexpected format.");
  });
});

describe("getRoadmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns roadmap when user is authenticated and has one", async () => {
    const { getRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.findUnique.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    actionMocks.roadmapFindUnique.mockResolvedValue({
      id: "roadmap-1",
      content: { milestones: [], totalEstimatedTime: "12 months", summary: "Test" },
    });

    const result = await getRoadmap();

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.findUnique).toHaveBeenCalled();
    expect(actionMocks.roadmapFindUnique).toHaveBeenCalledWith({
      where: { userId: "db-user-1" },
    });
    expect(result.roadmap?.id).toBe("roadmap-1");
    expect(result.error).toBeNull();
  });

  it("returns null when user is not authenticated", async () => {
    const { getRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: null });

    const result = await getRoadmap();
    expect(result).toEqual({ roadmap: null, error: null });
  });

  it("returns null when user is not found in DB", async () => {
    const { getRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.findUnique.mockResolvedValue(null);

    const result = await getRoadmap();
    expect(result).toEqual({ roadmap: null, error: null });
  });
});
