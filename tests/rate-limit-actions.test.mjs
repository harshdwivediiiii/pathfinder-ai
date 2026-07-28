import { describe, expect, it, vi, beforeEach } from "vitest";

const actionMocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
}));

vi.mock("@/lib/db/prisma", async () => {
  const actual = await vi.importActual("@/lib/db/prisma");
  return {
    ...actual,
    db: {
      $queryRaw: actionMocks.queryRaw,
      $executeRaw: actionMocks.executeRaw,
    },
  };
});

import { checkRateLimit, decrementRateLimit } from "../lib/rate-limit-actions.js";

describe("checkRateLimit - Atomic Implementation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const newActions = ["linkedin", "negotiation", "networking", "portfolio", "resumeBuilder"];

  newActions.forEach((action) => {
    it(`allows requests within the limit for action: ${action}`, async () => {
      actionMocks.queryRaw.mockResolvedValue([{ count: 1 }]);

      const result = await checkRateLimit("user-1", action);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(actionMocks.queryRaw).toHaveBeenCalled();
    });

    it(`blocks requests exceeding the limit for action: ${action}`, async () => {
      actionMocks.queryRaw.mockResolvedValue([{ count: 50 }]);

      const result = await checkRateLimit("user-1", action);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeDefined();
    });

    it(`handles empty query results as zero count for action: ${action}`, async () => {
      actionMocks.queryRaw.mockResolvedValue([]);

      const result = await checkRateLimit("user-1", action);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it(`decrements rate limit counter for action: ${action}`, async () => {
      actionMocks.executeRaw.mockResolvedValue(1);

      await decrementRateLimit("user-1", action);
      expect(actionMocks.executeRaw).toHaveBeenCalled();
    });
  });

  it("returns correct remaining count", async () => {
    actionMocks.queryRaw.mockResolvedValue([{ count: 3 }]);

    const result = await checkRateLimit("user-1", "resumeBuilder");
    expect(result.remaining).toBe(7);
  });
});
