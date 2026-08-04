import { describe, expect, it, vi, beforeEach } from "vitest";
import { server } from "./mocks/server.mjs";
import { http, HttpResponse } from "msw";

// Pre-create stable mock functions
const mockAuth = vi.fn();
const mockGenerate = vi.fn();
const mockSafeFetch = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockDecrementRateLimit = vi.fn();
const mockQueryRaw = vi.fn();

// Configure vi.mock to use our pre-created functions
vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/ai/gemini", () => ({ generateGeminiContent: mockGenerate }));
vi.mock("@/lib/security/safe-fetch", () => ({ safeFetch: mockSafeFetch }));
vi.mock("@/lib/db/prisma", () => ({ db: { $queryRaw: mockQueryRaw } }));
vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mockCheckRateLimit,
  decrementRateLimit: mockDecrementRateLimit,
}));

import { parseJobUrl } from "../actions/job-scraper.js";

describe("parseJobUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset and configure defaults for each test
    mockQueryRaw.mockResolvedValue([{ count: 1 }]);
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockAuth.mockResolvedValue({ userId: undefined });
    mockSafeFetch.mockResolvedValue({
      success: true,
      text: "<html><body><h1>Software Engineer</h1><p>Tech Corp</p></body></html>",
      status: 200,
    });
    mockGenerate.mockReset();
    mockDecrementRateLimit.mockReset();
  });

  it("successfully parses a job URL using generateGeminiContent and parseAIJson", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockSafeFetch.mockResolvedValue({
      success: true,
      text: "<html><body><h1>Software Engineer</h1><p>Tech Corp</p></body></html>",
      status: 200,
    });
    mockGenerate.mockResolvedValue({
      response: {
        text: () =>
          "```json\n{\n  \"companyName\": \"Tech Corp\",\n  \"jobTitle\": \"Software Engineer\",\n  \"location\": \"San Francisco, CA\",\n  \"salary\": \"$150k - $180k\",\n  \"jobDescription\": \"We are looking for a Software Engineer.\"\n}\n```",
      },
    });

    server.use(
      http.get("https://example.com/jobs/1", () => {
        return HttpResponse.text(
          "<html><body><h1>Software Engineer</h1><p>Tech Corp</p></body></html>"
        );
      })
    );

    const result = await parseJobUrl("https://example.com/jobs/1");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      companyName: "Tech Corp",
      jobTitle: "Software Engineer",
      location: "San Francisco, CA",
      salary: "$150k - $180k",
      jobDescription: "We are looking for a Software Engineer.",
    });
    expect(mockGenerate).toHaveBeenCalled();
  });

  it("returns unauthorized error if user is not logged in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await parseJobUrl("https://example.com/jobs/1");
    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("Unauthorized");
  });
});
