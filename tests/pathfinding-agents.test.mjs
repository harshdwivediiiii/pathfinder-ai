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

const corridorGraph = {
  type: "corridor",
  getNeighbors: (node) => {
    const neighbors = {
      A1: [{ node: "C1", weight: 1 }],
      C1: [{ node: "A1", weight: 1 }, { node: "B1", weight: 1 }],
      B1: [{ node: "C1", weight: 1 }, { node: "B2", weight: 1 }],
      B2: [{ node: "B1", weight: 1 }, { node: "C2", weight: 1 }],
      C2: [{ node: "B2", weight: 1 }, { node: "A2", weight: 1 }],
      A2: [{ node: "C2", weight: 1 }],
    };
    return neighbors[node] ?? [];
  },
};

const narrowGraph = {
  type: "narrow",
  getNeighbors: (node) => {
    const neighbors = {
      S1: [{ node: "B", weight: 1 }],
      B: [
        { node: "S1", weight: 1 },
        { node: "G1", weight: 1 },
        { node: "S2", weight: 1 },
        { node: "G2", weight: 1 },
      ],
      G1: [{ node: "B", weight: 1 }],
      S2: [{ node: "B", weight: 1 }],
      G2: [{ node: "B", weight: 1 }],
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

  it("coordinates agents to conflict-free routes", async () => {
    const coordinator = new MultiAgentCoordinator(corridorGraph, { maxIterations: 20 });
    coordinator.addAgent(new Agent("agent-1", "A1", "B1"));
    coordinator.addAgent(new Agent("agent-2", "A2", "B2"));

    const result = await coordinator.coordinate();

    expect(result.converged).toBe(true);
    const path1 = result.agents["agent-1"].path;
    const path2 = result.agents["agent-2"].path;
    expect(path1.length).toBeGreaterThan(0);
    expect(path2.length).toBeGreaterThan(0);
    expect(path1.some((node) => path2.includes(node))).toBe(false);
  });

  it("does not converge when an agent cannot reach its goal without conflicts", async () => {
    const coordinator = new MultiAgentCoordinator(narrowGraph, { maxIterations: 5 });
    coordinator.addAgent(new Agent("agent-1", "S1", "G1"));
    coordinator.addAgent(new Agent("agent-2", "S2", "G2"));

    const result = await coordinator.coordinate();

    expect(result.converged).toBe(false);
    expect(result.agents["agent-2"].status).toBe("blocked");
    expect(result.history[0].conflicts.length).toBeGreaterThan(0);
  });

  it("persists constraints so replans avoid previously blocked routes", () => {
    const coordinator = new MultiAgentCoordinator(narrowGraph);
    const agent = new Agent("agent-2", "S2", "G2");
    coordinator.addAgent(agent);

    const path = coordinator.replanForAgent(agent, ["S1", "B", "G1"]);

    expect(path.length).toBe(0);
    expect(agent.constraints.blockedNodes).toEqual(["S1", "B", "G1"]);
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
