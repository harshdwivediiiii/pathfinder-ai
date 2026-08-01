import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies
const mockInvoke = vi.fn();
const mockWithStructuredOutput = vi.fn(() => ({
  invoke: mockInvoke,
}));

vi.mock("@langchain/google-genai", () => {
  return {
    ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => {
      return {
        bindTools: vi.fn().mockReturnValue({
          invoke: vi.fn().mockResolvedValue({
            tool_calls: [
              {
                name: "fetch_trending_job_market_skills",
                args: { role: "Software Engineer", industry: "Tech" },
              },
            ],
          }),
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
    Object.defineProperty(mockTool, 'name', { value: config.name });
    return mockTool;
  }),
}));

describe("Roadmap Adaptation Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("adapts roadmap correctly using LangChain agent", async () => {
    const { adaptCareerRoadmapWithAgent } = await import("../lib/ai/roadmap-agent.js");
    
    mockInvoke.mockResolvedValueOnce({
      milestones: [
        {
          title: "Learn Rust",
          description: "Systems programming.",
          skillsToLearn: ["Rust"],
          estimatedDuration: "2 months",
          priority: "high",
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
          description: "Web dev.",
          skillsToLearn: ["JS"],
          estimatedDuration: "1 month",
          priority: "high",
          isCompleted: true,
        },
      ],
      targetRole: "Software Engineer",
      industry: "Tech",
    });

    expect(result.milestones).toHaveLength(1);
    expect(result.milestones[0].title).toBe("Learn Rust");
    expect(mockWithStructuredOutput).toHaveBeenCalled();
  });
});
