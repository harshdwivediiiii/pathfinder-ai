import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  generateGeminiContent: vi.fn(),
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/rate-limit-actions", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: mocks.formatResetTime,
}));

import { parseJobUrl } from "../actions/job-scraper.js";

describe("parseJobUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatResetTime.mockReturnValue("60 minutes");
  });

  it("successfully parses job page when within rate limits", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    
    // Mock global fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body><h1>Software Engineer</h1></body></html>"),
    });
    vi.stubGlobal("fetch", mockFetch);

    mocks.generateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          companyName: "Google",
          jobTitle: "Software Engineer",
          location: "Mountain View, CA",
          salary: "150,000",
          jobDescription: "Build amazing search engines.",
        }),
      },
    });

    const result = await parseJobUrl("https://example.com/job/123");

    expect(result.success).toBe(true);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("user-1", "jobScraper");
    expect(result.data.companyName).toBe("Google");
  });

  it("fails when rate limit is exceeded", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, resetAt: new Date() });

    const result = await parseJobUrl("https://example.com/job/123");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toContain("limit reached");
  });
});
