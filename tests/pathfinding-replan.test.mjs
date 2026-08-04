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

import { DynamicRePlanner } from "@/lib/algorithms/dynamic-replan.js";
import { dynamicReplan } from "../actions/pathfinding.js";

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

describe("DynamicRePlanner", () => {
  it("replans an agent affected by a batch edge-blocked change", async () => {
    const replanner = new DynamicRePlanner(simpleGraph);
    const agent = {
      id: "agent-1",
      start: "A",
      goal: "D",
      constraints: {},
      currentPath: ["A", "B", "C", "D"],
      status: "active",
    };
    replanner.setAgents([agent]);

    replanner.onGraphChange({ type: "batch", changes: [{ type: "edge-blocked", from: "B", to: "C" }] });
    const result = await replanner.processReplanQueue();
    clearTimeout(replanner.pendingTimeout);

    expect(result.processed).toBe(1);
    expect(result.agentsReplanned).toBe(1);
    expect(result.changes).toEqual(["edge-blocked"]);
    expect(agent.currentPath.length).toBeGreaterThan(0);
  });

  it("processes an individual edge-blocked change", async () => {
    const replanner = new DynamicRePlanner(simpleGraph);
    const agent = {
      id: "agent-1",
      start: "A",
      goal: "D",
      constraints: {},
      currentPath: ["A", "B", "C", "D"],
      status: "active",
    };
    replanner.setAgents([agent]);

    replanner.onGraphChange({ type: "edge-blocked", from: "B", to: "C" });
    const result = await replanner.processReplanQueue();
    clearTimeout(replanner.pendingTimeout);

    expect(result.agentsReplanned).toBe(1);
    expect(agent.currentPath.length).toBeGreaterThan(0);
  });
});

describe("dynamicReplan action", () => {
  it("registers changes before processing and returns the replan result", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });

    const result = await dynamicReplan({
      graph: simpleGraph,
      agentId: "agent-1",
      changes: [{ type: "edge-blocked", from: "B", to: "C" }],
      agentState: { start: "A", goal: "D", currentPath: ["A", "B", "C", "D"] },
    });

    expect(result.success).toBe(true);
    expect(result.data.result.processed).toBe(1);
    expect(result.data.result.agentsReplanned).toBe(1);
    expect(result.data.result.changes).toEqual(["edge-blocked"]);
  });
});
