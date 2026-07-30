import { describe, expect, it, vi, beforeEach } from "vitest";

const actionMocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    $queryRaw: actionMocks.queryRaw,
    $executeRaw: actionMocks.executeRaw,
  },
}));

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
      // Set count to a very high number that exceeds any maxRequests limit
      actionMocks.queryRaw.mockResolvedValue([{ count: 50 }]);

      const result = await checkRateLimit("user-1", action);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(actionMocks.queryRaw).toHaveBeenCalled();
    });
  });

  it("throws an error for unknown action keys", async () => {
    await expect(checkRateLimit("user-1", "unknownActionKey")).rejects.toThrow(
      "Unknown rate limit action: unknownActionKey"
    );
  });

  it("atomically decrements the rate limit count using $executeRaw", async () => {
    actionMocks.executeRaw.mockResolvedValue(1);

    await decrementRateLimit("user-1", "chat");
    expect(actionMocks.executeRaw).toHaveBeenCalled();
  });
});
