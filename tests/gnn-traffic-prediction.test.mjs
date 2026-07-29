import { describe, expect, it } from "vitest";
import { GNNTrafficPredictor } from "../lib/ai/gnn-traffic-prediction.js";

describe("GNNTrafficPredictor", () => {
  it("loads a model without error", async () => {
    const predictor = new GNNTrafficPredictor();
    await expect(predictor.loadModel()).resolves.not.toThrow();
    expect(predictor.isLoaded).toBe(true);
  });

  it("predicts future traffic weights for a graph", async () => {
    const predictor = new GNNTrafficPredictor();
    const graph = {
      nodes: [
        {
          id: "node-1",
          edges: [
            { to: "node-2", baseWeight: 120 },
            { to: "node-3", baseWeight: 200 }
          ]
        }
      ]
    };
    const rushHour = new Date("2026-07-27T08:00:00"); // Monday 8am
    const updated = await predictor.predictFutureTraffic(graph, rushHour);

    expect(updated).toBeDefined();
    expect(updated.nodes[0].edges[0].predictedWeight).toBeDefined();
    expect(updated.nodes[0].edges[0].predictedWeight).toBeGreaterThan(0);
  });

  it("applies a higher scaling factor at rush hour vs off-peak", async () => {
    const predictor = new GNNTrafficPredictor();

    const makeGraph = () => ({
      nodes: [{ id: "A", edges: [{ to: "B", baseWeight: 100 }] }]
    });

    const rushHour = new Date("2026-07-27T08:00:00");
    const offPeak  = new Date("2026-07-27T14:00:00");

    const rushResult = await predictor.predictFutureTraffic(makeGraph(), rushHour);
    const offResult  = await predictor.predictFutureTraffic(makeGraph(), offPeak);

    expect(rushResult.nodes[0].edges[0].predictedWeight)
      .toBeGreaterThanOrEqual(offResult.nodes[0].edges[0].predictedWeight);
  });
});
