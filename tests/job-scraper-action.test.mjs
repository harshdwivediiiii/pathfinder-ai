import { describe, expect, it, vi, beforeEach } from "vitest";
import { server } from "./mocks/server.mjs";
import { http, HttpResponse } from "msw";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  generateGeminiContent: vi.fn(),
  safeFetch: vi.fn(),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  formatResetTime: vi.fn().mockReturnValue("10 minutes"),
  decrementRateLimit: vi.fn().mockResolvedValue(true),
  handleServerError: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/errors/error-handler", () => ({
  handleServerError: mocks.handleServerError,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/security/safe-fetch", () => ({
  safeFetch: mocks.safeFetch,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: { $queryRaw: vi.fn() },
}));

vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  decrementRateLimit: mocks.decrementRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

import { parseJobUrl } from "../actions/job-scraper.js";

describe("parseJobUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.formatResetTime.mockReturnValue("10 minutes");
    mocks.safeFetch.mockResolvedValue({
      success: true,
      status: 200,
      text: "<html><body><h1>Software Engineer</h1><p>Tech Corp</p></body></html>",
    });
    mocks.handleServerError.mockReturnValue({ success: false, error: "handled" });
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

  it("handles rate limit exceeded with missing resetAt by passing a Date instance to formatResetTime", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false }); // No resetAt provided

    const result = await parseJobUrl("https://example.com/jobs/1");

    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("Job scraping limit reached. Resets in 10 minutes.");
    expect(mocks.formatResetTime).toHaveBeenCalledWith(expect.any(Date));
  });

  it("refunds the quota when safeFetch fails", async () => {
    mocks.safeFetch.mockResolvedValue({
      success: false,
      errors: { _form: ["Network error while fetching the job URL."] },
    });

    const result = await parseJobUrl("https://example.com/jobs/1");

    expect(result.success).toBe(false);
    expect(mocks.decrementRateLimit).toHaveBeenCalledWith("user-1", "jobScraper");
  });

  it("refunds the quota when the fetch returns a non-200 status", async () => {
    mocks.safeFetch.mockResolvedValue({
      success: true,
      status: 503,
      text: "",
    });

    const result = await parseJobUrl("https://example.com/jobs/1");

    expect(result.success).toBe(false);
    expect(result.errors._form).toContain("Fetch failed with status 503");
    expect(mocks.decrementRateLimit).toHaveBeenCalledWith("user-1", "jobScraper");
  });

  it("refunds the quota when AI extraction fails", async () => {
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => "" },
    });

    const result = await parseJobUrl("https://example.com/jobs/1");

    expect(result.success).toBe(false);
    expect(mocks.decrementRateLimit).toHaveBeenCalledWith("user-1", "jobScraper");
  });

  it("does not refund the quota when the rate limit is hit", async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: null });

    const result = await parseJobUrl("https://example.com/jobs/1");

    expect(result.success).toBe(false);
    expect(mocks.decrementRateLimit).not.toHaveBeenCalled();
  });
});
