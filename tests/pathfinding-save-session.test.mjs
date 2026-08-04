import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserByScope: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    pathfindingSession: {
      create: mocks.createSession,
    },
  },
}));

vi.mock("@/lib/db/user-scope", () => ({
  getUserByScope: mocks.getUserByScope,
}));

import { compareAlgorithms } from "../actions/pathfinding.js";

const simpleGraph = {
  type: "simple",
  getNeighbors: (node) => {
    const neighbors = {
      A: [{ node: "B", weight: 1 }, { node: "C", weight: 4 }],
      B: [{ node: "A", weight: 1 }, { node: "C", weight: 2 }, { node: "D", weight: 5 }],
      C: [{ node: "A", weight: 4 }, { node: "B", weight: 2 }, { node: "D", weight: 1 }],
      D: [{ node: "B", weight: 5 }, { node: "C", weight: 1 }],
    };
    return neighbors[node] ?? [];
  },
};

describe("compareAlgorithms session persistence", () => {
  it("persists the session with the resolved DB user id", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.getUserByScope.mockResolvedValue({ id: "db-user-1", clerkUserId: "clerk-user-1" });
    mocks.createSession.mockResolvedValue({ id: "session-1" });

    const result = await compareAlgorithms({
      graph: simpleGraph,
      start: "A",
      goal: "D",
      options: { saveToDatabase: true, sessionName: "My session" },
    });

    expect(result.success).toBe(true);
    expect(mocks.getUserByScope).toHaveBeenCalledWith("clerk-user-1");
    expect(mocks.createSession).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "db-user-1",
        name: "My session",
        algorithmType: expect.any(String),
        status: "active",
      }),
    });
  });

  it("rejects with UNAUTHORIZED when the Clerk user has no DB row", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-unknown" });
    mocks.getUserByScope.mockResolvedValue(null);

    const res = await compareAlgorithms({
      graph: simpleGraph,
      start: "A",
      goal: "D",
      options: { saveToDatabase: true },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});
