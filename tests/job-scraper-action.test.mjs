import { describe, expect, it, vi, beforeEach } from "vitest";
import { server } from "./mocks/server.mjs";
import { http, HttpResponse } from "msw";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  generateGeminiContent: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

import { parseJobUrl } from "../actions/job-scraper.js";

describe("parseJobUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully parses a job URL using generateGeminiContent and parseAIJson", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    
    // Mock the HTTP request using MSW
    server.use(
      http.get("https://example.com/jobs/1", () => {
        return HttpResponse.text("<html><body><h1>Software Engineer</h1><p>Tech Corp</p></body></html>");
      })
    );

    // Mock AI JSON result with markdown blocks, which parseAIJson should strip and parse
    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => "```json\n{\n  \"companyName\": \"Tech Corp\",\n  \"jobTitle\": \"Software Engineer\",\n  \"location\": \"San Francisco, CA\",\n  \"salary\": \"$150k - $180k\",\n  \"jobDescription\": \"We are looking for a Software Engineer.\"\n}\n```",
      },
    });

    const result = await parseJobUrl("https://example.com/jobs/1");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      companyName: "Tech Corp",
      jobTitle: "Software Engineer",
      location: "San Francisco, CA",
      salary: "$150k - $180k",
      jobDescription: "We are looking for a Software Engineer.",
    });
    expect(mocks.generateGeminiContent).toHaveBeenCalled();
  });

  it("returns unauthorized error if user is not logged in", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const result = await parseJobUrl("https://example.com/jobs/1");
    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("Unauthorized");
  });
});
