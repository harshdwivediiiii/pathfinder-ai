import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
  getRateLimitIdentifier: vi.fn(),
  enforceRateLimit: vi.fn(),
  buildRateLimitResponse: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/rate-limit", () => ({
  getRateLimitIdentifier: mocks.getRateLimitIdentifier,
  enforceRateLimit: mocks.enforceRateLimit,
  buildRateLimitResponse: mocks.buildRateLimitResponse,
}));

// Mock isFeatureEnabled to always allow chat
vi.mock("@/lib/ai-gating", () => ({
  isFeatureEnabled: () => true,
}));

import { POST } from "../app/api/generate/route.js";

describe("POST /api/generate - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.getRateLimitIdentifier.mockReturnValue({ kind: "user", value: "user-1" });
    mocks.enforceRateLimit.mockResolvedValue({ allowed: true, remaining: 10, retryAfterSeconds: 0 });
  });

  it("returns SSE error on prompt validation failure", async () => {
    const req = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "" }), // empty prompt (fails validation)
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await response.text();
    expect(text).toContain("event: error");
    expect(text).toContain("VALIDATION_ERROR");
  });

  it("returns SSE error when user profile not found in database", async () => {
    mocks.db.user.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "resume career" }), // career-related prompt
    });

    const response = await POST(req);
    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await response.text();
    expect(text).toContain("event: error");
    expect(text).toContain("USER_NOT_FOUND");
  });
});
