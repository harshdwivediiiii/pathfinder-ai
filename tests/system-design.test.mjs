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

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

import { checkRateLimit, formatResetTime } from "@/lib/security/rate-limit-actions";

describe("analyzeSystemDesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true });
    formatResetTime.mockReturnValue("12:00:00");
  });

  it("returns unauthorized if no user", async () => {
    auth.mockResolvedValue({ userId: null });
    const result = await analyzeSystemDesign("base64data");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when rate limit exceeded", async () => {
    auth.mockResolvedValue({ userId: "user-1" });
    checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });

    const result = await analyzeSystemDesign("data:image/png;base64,bW9jaw==");

    expect(result.success).toBe(false);
    expect(result.error).toContain("limit reached");
  });

  it("rejects input without a data URL prefix", async () => {
    auth.mockResolvedValue({ userId: "user-1" });

    const result = await analyzeSystemDesign("mockbase64");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid image format");
  });

  it("rejects unsupported image types", async () => {
    auth.mockResolvedValue({ userId: "user-1" });

    const result = await analyzeSystemDesign("data:image/svg+xml;base64,bW9jaw==");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsupported image type");
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

    const result = await analyzeSystemDesign("data:image/png;base64,bW9jaw==");
    
    expect(result.success).toBe(true);
    expect(result.analysis).toEqual(mockJson);
    expect(generateGeminiContent).toHaveBeenCalled();
  });

  it("handles AI generation failure", async () => {
    auth.mockResolvedValue({ userId: "user-1" });
    
    generateGeminiContent.mockRejectedValue(new Error("AI service unavailable"));

    const result = await analyzeSystemDesign("data:image/png;base64,bW9jaw==");
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("AI service unavailable");
  });

  it("strips the data:image/svg+xml prefix and sends mimeType image/svg+xml", async () => {
    auth.mockResolvedValue({ userId: "user-1" });

    generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          summary: "summary",
          bottlenecks: [],
          suggestions: [],
          overallFeedback: "feedback",
        }),
      },
    });

    const svgData = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==";
    const result = await analyzeSystemDesign(`data:image/svg+xml;base64,${svgData}`);

    expect(result.success).toBe(true);

    const [request] = generateGeminiContent.mock.calls[0];
    const inlineData = request.contents[0].parts.find((part) => part.inlineData).inlineData;
    expect(inlineData.data).toBe(svgData);
    expect(inlineData.mimeType).toBe("image/svg+xml");
  });
});
