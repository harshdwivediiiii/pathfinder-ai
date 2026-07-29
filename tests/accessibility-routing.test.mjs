import { describe, expect, it } from "vitest";
import { AccessibilityRouter } from "../lib/ai/accessibility-routing.js";

describe("AccessibilityRouter", () => {
  it("filters out stairs when avoidStairs is true", () => {
    const router = new AccessibilityRouter({ avoidStairs: true });
    const graph = {
      nodes: [
        { id: 1, hasStairs: true, hasElevator: false },
        { id: 2, hasStairs: true, hasElevator: true },
        { id: 3, hasStairs: false, hasElevator: false }
      ]
    };
    const result = router.filterAccessibleGraph(graph, { wheelchairAccessible: true });
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.map(n => n.id)).toEqual([2, 3]);
  });

  it("filters edges with steep gradients", () => {
    const router = new AccessibilityRouter({ maxGradient: 8.0 });
    const graph = {
      nodes: [
        {
          id: 1,
          edges: [
            { to: 2, gradient: 5.0 },
            { to: 3, gradient: 10.0 }
          ]
        }
      ]
    };
    const result = router.filterAccessibleGraph(graph, { wheelchairAccessible: true });
    expect(result.nodes[0].edges).toHaveLength(1);
    expect(result.nodes[0].edges[0].to).toBe(2);
  });
});
