import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeSystemDesign } from "../actions/system-design.js";
import { generateGeminiContent } from "@/lib/ai/gemini.js";
import { auth } from "@clerk/nextjs/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: vi.fn(),
}));

describe("analyzeSystemDesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized if no user", async () => {
    auth.mockResolvedValue({ userId: null });
    const result = await analyzeSystemDesign("base64data");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("analyzes valid system design successfully", async () => {
    auth.mockResolvedValue({ userId: "user-1" });
    
    const mockJson = {
      summary: "This is a great design.",
      bottlenecks: ["Single point of failure at DB"],
      suggestions: ["Add a read replica"],
      overallFeedback: "Good start!"
    };

    generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockJson)
      }
    });

    const result = await analyzeSystemDesign("data:image/png;base64,mockbase64");
    
    expect(result.success).toBe(true);
    expect(result.analysis).toEqual(mockJson);
    expect(generateGeminiContent).toHaveBeenCalled();
  });

  it("handles AI generation failure", async () => {
    auth.mockResolvedValue({ userId: "user-1" });
    
    generateGeminiContent.mockRejectedValue(new Error("AI service unavailable"));

    const result = await analyzeSystemDesign("mockbase64");
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("AI service unavailable");
  });
});
