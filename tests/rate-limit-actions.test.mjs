import { describe, expect, it, vi, beforeEach } from "vitest";

const actionMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    aiRateLimit: {
      findUnique: actionMocks.findUnique,
      upsert: actionMocks.upsert,
    },
  },
}));

import { checkRateLimit } from "../lib/rate-limit-actions.js";

describe("checkRateLimit - Newly Configured Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const newActions = ["linkedin", "negotiation", "networking", "portfolio", "resumeBuilder"];

  newActions.forEach((action) => {
    it(`allows requests within the limit for action: ${action}`, async () => {
      actionMocks.findUnique.mockResolvedValue(null);
      actionMocks.upsert.mockResolvedValue({});

      const result = await checkRateLimit("user-1", action);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(actionMocks.findUnique).toHaveBeenCalled();
      expect(actionMocks.upsert).toHaveBeenCalled();
    });

    it(`blocks requests exceeding the limit for action: ${action}`, async () => {
      // Set count to a very high number that exceeds any maxRequests limit
      actionMocks.findUnique.mockResolvedValue({
        count: 50,
      });

      const result = await checkRateLimit("user-1", action);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(actionMocks.findUnique).toHaveBeenCalled();
      expect(actionMocks.upsert).not.toHaveBeenCalled();
    });
  });

  it("throws an error for unknown action keys", async () => {
    await expect(checkRateLimit("user-1", "unknownActionKey")).rejects.toThrow(
      "Unknown rate limit action: unknownActionKey"
    );
  });
});
