import { describe, it, expect } from "vitest";
import { Agent, MultiAgentCoordinator } from "@/lib/algorithms/agent-engine.js";
import { DynamicRePlanner } from "@/lib/algorithms/dynamic-replan.js";

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

describe("MultiAgentCoordinator", () => {
  it("returns real paths when planning an agent route", () => {
    const coordinator = new MultiAgentCoordinator(simpleGraph);
    const agent = new Agent("agent-1", "A", "D");
    coordinator.addAgent(agent);

    const path = coordinator.planPath(agent);

    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toBe("A");
    expect(path[path.length - 1]).toBe("D");
  });

  it("coordinates agents to non-empty paths", async () => {
    const coordinator = new MultiAgentCoordinator(simpleGraph, { maxIterations: 20 });
    coordinator.addAgent(new Agent("agent-1", "A", "D"));
    coordinator.addAgent(new Agent("agent-2", "D", "A"));

    const result = await coordinator.coordinate();

    expect(result.converged).toBe(true);
    expect(result.agents["agent-1"].path.length).toBeGreaterThan(0);
    expect(result.agents["agent-2"].path.length).toBeGreaterThan(0);
  });
});

describe("DynamicRePlanner", () => {
  it("replans an agent to a non-empty path", async () => {
    const replanner = new DynamicRePlanner(simpleGraph);
    const agent = {
      id: "agent-1",
      start: "A",
      goal: "D",
      constraints: {},
      currentPath: [],
      status: "active",
    };

    const result = await replanner.replanAgent(agent, []);

    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toBe("A");
    expect(result.path[result.path.length - 1]).toBe("D");
  });
});
