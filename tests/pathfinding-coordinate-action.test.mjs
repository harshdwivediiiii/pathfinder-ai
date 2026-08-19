import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {},
}));

import { coordinateAgents } from "../actions/pathfinding.js";

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

describe("coordinateAgents", () => {
  it("coordinates two agents without throwing", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });

    const result = await coordinateAgents({
      graph: simpleGraph,
      agents: [
        { id: "agent-1", start: "A", goal: "D" },
        { id: "agent-2", start: "D", goal: "A" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data.agentStates["agent-1"]).toBeDefined();
    expect(result.data.agentStates["agent-2"]).toBeDefined();
    expect(Array.isArray(result.data.agentStates["agent-1"].path)).toBe(true);
    expect(Array.isArray(result.data.agentStates["agent-2"].path)).toBe(true);
  });
});
