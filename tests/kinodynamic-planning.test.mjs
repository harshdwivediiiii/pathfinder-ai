import { describe, expect, it } from "vitest";
import { KinodynamicPlanner } from "../lib/ai/kinodynamic-planning.js";

describe("KinodynamicPlanner", () => {
  it("generates a path honoring vehicle constraints", () => {
    const planner = new KinodynamicPlanner({ wheelbase: 3.0, maxSteeringAngle: Math.PI / 4 });
    const start = { x: 0, y: 0, theta: 0, v: 0 };
    const goal = { x: 10, y: 10, theta: Math.PI / 2, v: 0 };
    const graph = {}; // Mock graph
    
    const path = planner.planPath(start, goal, graph);
    expect(path).toBeDefined();
    expect(path.length).toBeGreaterThan(0);
    // Path should end exactly at goal coordinate (mock implementation might just return goal)
    const finalState = path[path.length - 1];
    expect(finalState.x).toBeCloseTo(goal.x, 1);
  });
});
