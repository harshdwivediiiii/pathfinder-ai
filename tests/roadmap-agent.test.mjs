import { describe, expect, it, vi, beforeEach } from "vitest";

const mockInvoke = vi.fn();
const mockWithStructuredOutput = vi.fn(() => ({
  invoke: mockInvoke,
}));
const mockBindToolsInvoke = vi.fn();

vi.mock("@langchain/google-genai", () => {
  return {
    ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => {
      return {
        bindTools: vi.fn().mockReturnValue({
          invoke: mockBindToolsInvoke,
        }),
        withStructuredOutput: mockWithStructuredOutput,
      };
    }),
  };
});

vi.mock("@langchain/core/tools", () => ({
  tool: vi.fn((fn, config) => {
    const mockTool = vi.fn(fn);
    mockTool.invoke = mockTool;
    Object.defineProperty(mockTool, "name", { value: config.name });
    Object.defineProperty(mockTool, "description", { value: config.description });
    return mockTool;
  }),
}));

describe("Roadmap Adaptation Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    mockBindToolsInvoke.mockResolvedValue({
      tool_calls: [
        {
          name: "fetch_trending_job_market_skills",
          args: { role: "Software Engineer", industry: "Tech" },
        },
      ],
    });
  });

  it("adapts roadmap using curated market guidance", async () => {
    const { adaptCareerRoadmapWithAgent, fetchTrendingSkillsTool } = await import(
      "../lib/ai/roadmap-agent.js"
    );

    expect(fetchTrendingSkillsTool.description).toMatch(/not a real-time/i);

    mockInvoke.mockResolvedValueOnce({
      milestones: [
        {
          title: "Learn TypeScript",
          description: "Strengthen typed front-end fundamentals for production apps.",
          skillsToLearn: ["TypeScript"],
          estimatedDuration: "2 months",
          priority: "high",
          isCompleted: false,
        },
        {
          title: "Cloud fundamentals",
          description: "Learn deployment and container basics for modern teams.",
          skillsToLearn: ["Kubernetes"],
          estimatedDuration: "2 months",
          priority: "medium",
          isCompleted: false,
        },
        {
          title: "AI-assisted delivery",
          description: "Practice AI-augmented development workflows safely.",
          skillsToLearn: ["AI-assisted development"],
          estimatedDuration: "1 month",
          priority: "medium",
          isCompleted: false,
        },
      ],
      summary: "Adapted roadmap",
    });

    const result = await adaptCareerRoadmapWithAgent({
      currentMilestones: [
        {
          id: "m1",
          title: "Learn JavaScript",
          description: "Web dev fundamentals for the role.",
          skillsToLearn: ["JS"],
          estimatedDuration: "1 month",
          priority: "high",
          isCompleted: true,
        },
      ],
      targetRole: "Software Engineer",
      industry: "Tech",
    });

    expect(result.adapted).toBe(true);
    expect(result.milestones).toHaveLength(3);
    expect(result.milestones[0].title).toBe("Learn TypeScript");
    expect(mockWithStructuredOutput).toHaveBeenCalled();
  });

  it("preserves the roadmap when market skills cannot be resolved", async () => {
    const { adaptCareerRoadmapWithAgent } = await import("../lib/ai/roadmap-agent.js");
    const currentMilestones = [
      {
        id: "m1",
        title: "Keep Me",
        description: "Existing unfinished work that must stay intact.",
        skillsToLearn: ["JS"],
        estimatedDuration: "1 month",
        priority: "high",
        isCompleted: false,
      },
    ];

    const result = await adaptCareerRoadmapWithAgent({
      currentMilestones,
      targetRole: "",
      industry: "Tech",
    });

    expect(result.adapted).toBe(false);
    expect(result.milestones).toEqual(currentMilestones);
    expect(result.summary).toMatch(/preserved/i);
    expect(mockWithStructuredOutput).not.toHaveBeenCalled();
  });

  it("exposes role and industry specific curated skills through the tool", async () => {
    const { fetchTrendingSkillsTool } = await import("../lib/ai/roadmap-agent.js");

    const embedded = JSON.parse(
      await fetchTrendingSkillsTool.invoke({
        role: "Embedded Engineer",
        industry: "Healthcare",
      })
    );
    const frontend = JSON.parse(
      await fetchTrendingSkillsTool.invoke({
        role: "Front-End Developer",
        industry: "Education",
      })
    );

    expect(embedded.available).toBe(true);
    expect(frontend.available).toBe(true);
    expect(embedded.isRealTime).toBe(false);
    expect(embedded.trending_skills).not.toEqual(frontend.trending_skills);
  });
});
