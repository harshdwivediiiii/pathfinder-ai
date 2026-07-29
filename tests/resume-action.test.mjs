import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  checkRateLimit: vi.fn(),
  cachedGenerateGeminiContent: vi.fn(),
  generateCacheKey: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("@/lib/security/rate-limit-actions.js", () => ({
  checkRateLimit: mocks.checkRateLimit,
  formatResetTime: vi.fn().mockReturnValue("10m"),
}));

vi.mock("@/lib/cache", async () => {
  const actual = await vi.importActual("@/lib/cache");
  return {
    ...actual,
    cachedGenerateGeminiContent: mocks.cachedGenerateGeminiContent,
    generateCacheKey: mocks.generateCacheKey,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { improveWithAI } from "../actions/resume.js";
import { buildUserProfileContext } from "@/lib/ai/ai-context.js";

describe("improveWithAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses cachedGenerateGeminiContent with the correct single cache key", async () => {
    const rawParams = {
      current: "Software Developer at Google with extensive React expertise.",
      type: "experience",
    };

    const mockUser = {
      id: "db-user-1",
      clerkUserId: "user-1",
      name: "John Doe",
      industry: "Tech",
    };

    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUnique.mockResolvedValue(mockUser);
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    
    mocks.generateCacheKey.mockReturnValue("improve:test-key");
    
    mocks.cachedGenerateGeminiContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          improvedContent: "Improved description...",
          highlights: ["Did X", "Achieved Y"],
        }),
      },
    });

    const result = await improveWithAI(rawParams);

    expect(result.success).toBe(true);
    
    // Verify that generateCacheKey was called exactly once with the expected parameters
    expect(mocks.generateCacheKey).toHaveBeenCalledTimes(1);
    expect(mocks.generateCacheKey).toHaveBeenCalledWith(
      "improve",
      mockUser.id,
      buildUserProfileContext(mockUser),
      rawParams.current,
      rawParams.type
    );

    // Verify cachedGenerateGeminiContent is called with the resolved key
    expect(mocks.cachedGenerateGeminiContent).toHaveBeenCalledWith(
      expect.any(String),
      {},
      expect.objectContaining({
        key: "improve:test-key",
        ttl: expect.any(Number),
      })
    );
  });
});
