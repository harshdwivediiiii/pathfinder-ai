import { describe, expect, it, vi, beforeEach } from "vitest";

import { careerRoadmapOutputSchema, SCHEMA_DESCRIPTIONS } from "@/lib/schemas/outputs.js";
import { validateOutput } from "../lib/ai/validate.js";
import { buildFormatCorrectionPrompt } from "../lib/ai/prompt-safety.js";

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
  userFindUnique: vi.fn(),
  roadmapFindUnique: vi.fn(),
  roadmapUpsert: vi.fn(),
  roadmapMilestoneDeleteMany: vi.fn(),
  milestoneFindUnique: vi.fn(),
  milestoneUpdate: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: actionMocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: actionMocks.userFindUnique,
    },
    roadmap: {
      findUnique: actionMocks.roadmapFindUnique,
      upsert: actionMocks.roadmapUpsert,
    },
    roadmapMilestone: {
      deleteMany: actionMocks.roadmapMilestoneDeleteMany,
      findUnique: actionMocks.milestoneFindUnique,
      update: actionMocks.milestoneUpdate,
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

vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePath,
}));

describe("generateCareerRoadmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a career roadmap successfully", async () => {
    const { generateCareerRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: true });
    actionMocks.userFindUnique
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
    actionMocks.roadmapUpsert.mockResolvedValue({
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
    expect(actionMocks.userFindUnique).toHaveBeenCalled();
    expect(actionMocks.generateGeminiContent).toHaveBeenCalled();
    expect(actionMocks.roadmapUpsert).toHaveBeenCalled();
    expect(result.id).toBe("roadmap-1");
  });

  it("returns error on unauthorized access", async () => {
    const { generateCareerRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: null });

    const result = await generateCareerRoadmap();

    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty("_form");
  });

  it("returns error when rate limit is exceeded", async () => {
    const { generateCareerRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date(Date.now() + 3600000) });
    actionMocks.formatResetTime.mockReturnValue("60 minutes");

    const result = await generateCareerRoadmap();

    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty("_form");
  });

  it("returns error when AI generation fails", async () => {
    const { generateCareerRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.checkRateLimit.mockResolvedValue({ allowed: true });
    actionMocks.userFindUnique
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

    const result = await generateCareerRoadmap();

    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty("_form");
  });
});

describe("getRoadmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns roadmap when user is authenticated and has one", async () => {
    const { getRoadmap } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user-1" });
    actionMocks.userFindUnique.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    actionMocks.roadmapFindUnique.mockResolvedValue({
      id: "roadmap-1",
      content: { milestones: [], totalEstimatedTime: "12 months", summary: "Test" },
    });

    const result = await getRoadmap();

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.userFindUnique).toHaveBeenCalled();
    expect(actionMocks.roadmapFindUnique).toHaveBeenCalledWith({
      where: { userId: "db-user-1" },
      include: {
        milestones: {
          orderBy: { createdAt: "asc" },
        },
      },
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
    actionMocks.userFindUnique.mockResolvedValue(null);

    const result = await getRoadmap();
    expect(result).toEqual({ roadmap: null, error: null });
  });
});

describe("toggleMilestoneCompletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 error response when user is unauthenticated", async () => {
    const { toggleMilestoneCompletion } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: null });

    const result = await toggleMilestoneCompletion("milestone-1", true);

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("Unauthorized");
  });

  it("returns 404 error response when Clerk ID is not found in database", async () => {
    const { toggleMilestoneCompletion } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user_clerk123" });
    actionMocks.userFindUnique.mockResolvedValue(null);

    const result = await toggleMilestoneCompletion("milestone-1", true);

    expect(actionMocks.auth).toHaveBeenCalled();
    expect(actionMocks.userFindUnique).toHaveBeenCalledWith({
      where: { clerkUserId: "user_clerk123" },
    });
    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("User not found");
  });

  it("returns 404 error response when milestone does not exist", async () => {
    const { toggleMilestoneCompletion } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user_clerk123" });
    actionMocks.userFindUnique.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      clerkUserId: "user_clerk123",
    });
    actionMocks.milestoneFindUnique.mockResolvedValue(null);

    const result = await toggleMilestoneCompletion("nonexistent-milestone", true);

    expect(actionMocks.milestoneFindUnique).toHaveBeenCalledWith({
      where: { id: "nonexistent-milestone" },
      include: { roadmap: { select: { userId: true } } },
    });
    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("Milestone not found");
  });

  it("returns 403 error response when attempting to update another user's milestone", async () => {
    const { toggleMilestoneCompletion } = await import("../actions/roadmap.js");

    actionMocks.auth.mockResolvedValue({ userId: "user_clerk123" });
    actionMocks.userFindUnique.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      clerkUserId: "user_clerk123",
    });
    actionMocks.milestoneFindUnique.mockResolvedValue({
      id: "milestone-other-user",
      roadmap: { userId: "99999999-e29b-41d4-a716-446655449999" },
    });

    const result = await toggleMilestoneCompletion("milestone-other-user", true);

    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("Forbidden");
    expect(actionMocks.milestoneUpdate).not.toHaveBeenCalled();
  });

  it("successfully toggles milestone completion when user owns the milestone", async () => {
    const { toggleMilestoneCompletion } = await import("../actions/roadmap.js");

    const internalUserId = "550e8400-e29b-41d4-a716-446655440000";
    const clerkUserId = "user_2abcXYZ123456";

    actionMocks.auth.mockResolvedValue({ userId: clerkUserId });
    actionMocks.userFindUnique.mockResolvedValue({
      id: internalUserId,
      clerkUserId: clerkUserId,
    });
    actionMocks.milestoneFindUnique.mockResolvedValue({
      id: "milestone-101",
      roadmap: { userId: internalUserId },
    });
    actionMocks.milestoneUpdate.mockResolvedValue({
      id: "milestone-101",
      isCompleted: true,
      title: "Assess Current Skills",
    });

    const result = await toggleMilestoneCompletion("milestone-101", true);

    // Verify Clerk ID resolves to database user
    expect(actionMocks.userFindUnique).toHaveBeenCalledWith({
      where: { clerkUserId },
    });
    // Verify ownership validation compares internal database user ID (UUID)
    expect(actionMocks.milestoneUpdate).toHaveBeenCalledWith({
      where: { id: "milestone-101" },
      data: { isCompleted: true },
    });
    // Verify cache revalidation
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/roadmap");
    // Verify return format
    expect(result).toEqual({
      milestone: {
        id: "milestone-101",
        isCompleted: true,
        title: "Assess Current Skills",
      },
      error: null,
    });
  });
});
