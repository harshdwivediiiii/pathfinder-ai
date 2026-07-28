import { describe, expect, it } from "vitest";
import { SemanticSLAM } from "../lib/ai/semantic-slam.js";

describe("SemanticSLAM", () => {
  it("extracts semantic landmarks from point clouds", () => {
    const slam = new SemanticSLAM();
    const sensorData = {
      odometry: { x: 0, y: 0, z: 0, heading: 0 },
      pointCloud: [
        { x: 1, y: 2, z: 3, label: "Door" },
        { x: 1, y: 2, z: 3, label: "Door" },
        { x: 1, y: 2, z: 3, label: "Door" },
        { x: 1, y: 2, z: 3, label: "Door" },
        { x: 1, y: 2, z: 3, label: "Door" },
        { x: 1, y: 2, z: 3, label: "Door" },
        { x: 5, y: 5, z: 0, label: "Stairs" },
        { x: 10, y: 10, z: 10, label: "Wall" }
      ]
    };
    slam.processFrame(sensorData);
    const graph = slam.getNavigationGraph();
    expect(graph.nodes.length).toBeGreaterThan(0);
    const hasDoor = graph.nodes.some(n => n.semanticLabel === "Door");
    expect(hasDoor).toBe(true);
  });
});
