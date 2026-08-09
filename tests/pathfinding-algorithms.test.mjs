import { describe, it, expect } from "vitest";
import { DijkstraAlgorithm } from "@/lib/algorithms/dijkstra.js";
import { AStarAlgorithm } from "@/lib/algorithms/astar.js";
import { BidirectionalBFSAlgorithm } from "@/lib/algorithms/bidirectional-bfs.js";
import { YenKShortestAlgorithm } from "@/lib/algorithms/yen-kshortest.js";
import { AlgorithmRegistry, ComparativeSolver } from "@/lib/algorithms/comparative-solver.js";

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
  nodeCoords: {
    A: [0, 0],
    B: [1, 0],
    C: [1, 1],
    D: [2, 1],
  },
};

describe("DijkstraAlgorithm", () => {
  it("finds shortest path from A to D", () => {
    const algo = new DijkstraAlgorithm();
    const result = algo.solve(simpleGraph, "A", "D");

    expect(result.path).toEqual(["A", "B", "C", "D"]);
    expect(result.cost).toBe(4);
    expect(result.path.length).toBeGreaterThan(0);
  });

  it("returns empty path for unreachable node", () => {
    const algo = new DijkstraAlgorithm();
    const result = algo.solve(simpleGraph, "A", "E");

    expect(result.path).toEqual([]);
    expect(result.cost).toBe(Infinity);
  });

  it("returns single-node path for start === goal", () => {
    const algo = new DijkstraAlgorithm();
    const result = algo.solve(simpleGraph, "A", "A");

    expect(result.path).toEqual(["A"]);
    expect(result.cost).toBe(0);
  });

  it("records nodes explored", () => {
    const algo = new DijkstraAlgorithm();
    const result = algo.solve(simpleGraph, "A", "D");

    expect(result.nodesExplored).toBeGreaterThan(0);
  });

  it("returns metadata", () => {
    const algo = new DijkstraAlgorithm();
    const result = algo.solve(simpleGraph, "A", "D");

    expect(result.metadata.algorithm).toBe("dijkstra");
  });
});

describe("AStarAlgorithm", () => {
  it("finds shortest path using heuristics", () => {
    const algo = new AStarAlgorithm();
    const result = algo.solve(simpleGraph, "A", "D");

    expect(result.path).toEqual(["A", "B", "C", "D"]);
    expect(result.cost).toBe(4);
  });

  it("uses custom heuristic if provided", () => {
    const customHeuristic = () => 0;
    const algo = new AStarAlgorithm(customHeuristic);
    const result = algo.solve(simpleGraph, "A", "D");

    expect(result.path.length).toBeGreaterThan(0);
    expect(result.cost).toBe(4);
  });

  it("uses Euclidean distance as default heuristic when coords available", () => {
    const algo = new AStarAlgorithm();
    const result = algo.solve(simpleGraph, "A", "D");

    expect(result.cost).toBe(4);
    expect(result.metadata.heuristic).toBeDefined();
  });
});

describe("BidirectionalBFSAlgorithm", () => {
  it("finds path from A to D", () => {
    const algo = new BidirectionalBFSAlgorithm();
    const result = algo.solve(simpleGraph, "A", "D");

    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toBe("A");
    expect(result.path[result.path.length - 1]).toBe("D");
  });

  it("finds path for start === goal", () => {
    const algo = new BidirectionalBFSAlgorithm();
    const result = algo.solve(simpleGraph, "A", "A");

    expect(result.path).toEqual(["A"]);
    expect(result.cost).toBe(0);
  });
});

describe("YenKShortestAlgorithm", () => {
  it("finds k shortest paths", () => {
    const algo = new YenKShortestAlgorithm(3);
    const result = algo.solve(simpleGraph, "A", "D");

    expect(result.path.length).toBeGreaterThan(0);
    expect(result.metadata.pathsFound).toBeGreaterThanOrEqual(1);
  });

  it("customizes k value", () => {
    const algo = new YenKShortestAlgorithm(5);
    algo.setK(5);
    expect(algo.metadata.k).toBe(5);
  });
});

describe("AlgorithmRegistry", () => {
  it("registers and lists algorithms", () => {
    const names = AlgorithmRegistry.getNames();
    expect(names).toContain("dijkstra");
    expect(names).toContain("astar");
    expect(names).toContain("bidirectional-bfs");
    expect(names).toContain("yen-k-shortest");
  });

  it("returns metadata for registered algorithms", () => {
    const meta = AlgorithmRegistry.getMetadata("dijkstra");
    expect(meta).toBeDefined();
    expect(meta.timeComplexity).toBeDefined();
  });

  it("returns metadata for all algorithms", () => {
    const allMeta = AlgorithmRegistry.getAllMetadata();
    expect(Object.keys(allMeta).length).toBeGreaterThan(0);
  });
});

describe("ComparativeSolver", () => {
  it("compares multiple algorithms on the same graph", () => {
    const solver = new ComparativeSolver(["dijkstra", "astar"]);
    const result = solver.solve(simpleGraph, "A", "D");

    expect(result.results.length).toBe(2);
    expect(result.comparison.weightedRanking.length).toBeGreaterThanOrEqual(1);
    expect(result.comparison.bestOverall).toBeDefined();
  });

  it("caches results when cache enabled", () => {
    const solver = new ComparativeSolver(["dijkstra"]);
    solver.setCacheEnabled(true);
    const result1 = solver.solve(simpleGraph, "A", "D");
    const result2 = solver.solve(simpleGraph, "A", "D");

    expect(result1.cacheHit ?? false).toBe(false);
    expect(result1.results[0].path).toEqual(result2.results[0].path);
  });

  it("scores results with weighted composite score", () => {
    const solver = new ComparativeSolver(["dijkstra", "astar"]);
    const result = solver.solve(simpleGraph, "A", "D", {
      weights: { cost: 0.5, speed: 0.3, exploration: 0.2 },
    });

    expect(result.comparison.weightedRanking.length).toBeGreaterThan(0);
    expect(result.comparison.weightedRanking[0].score).toBeGreaterThanOrEqual(0);
  });

  it("computes Pareto frontier", () => {
    const solver = new ComparativeSolver(["dijkstra", "astar", "bidirectional-bfs"]);
    const result = solver.solve(simpleGraph, "A", "D");

    expect(Array.isArray(result.comparison.paretoFrontier)).toBe(true);
  });

  it("invalidates cache when requested", () => {
    const solver = new ComparativeSolver(["dijkstra"]);
    solver.setCacheEnabled(true);
    solver.solve(simpleGraph, "A", "D");
    solver.invalidateCache();

    expect(solver.resultsCache.size).toBe(0);
  });

  it("fails gracefully when algorithm finds no path", () => {
    const solver = new ComparativeSolver(["dijkstra"]);
    const result = solver.solve(simpleGraph, "A", "E");

    expect(result.results[0].success).toBe(true);
    expect(result.results[0].path).toEqual([]);
  });

  it("ranks the cheaper path first when costs differ and exploration is equal", () => {
    const solver = new ComparativeSolver();
    const results = [
      { algorithm: "dijkstra", success: true, result: { path: ["A", "B", "C"], cost: 2, nodesExplored: 10 } },
      { algorithm: "astar", success: true, result: { path: ["A", "D", "E", "F"], cost: 4, nodesExplored: 10 } },
    ];

    const comparison = solver.compareResults(results, {
      weights: { cost: 0.6, speed: 0.2, safety: 0.05, scenic: 0.05, risk: 0.1 },
    });

    expect(comparison.weightedRanking[0].algorithm).toBe("dijkstra");
    expect(comparison.weightedRanking[1].algorithm).toBe("astar");
    expect(comparison.weightedRanking[0].score).toBeGreaterThan(comparison.weightedRanking[1].score);
    expect(comparison.bestOverall.algorithm).toBe("dijkstra");
  });

  it("gives equal-cost results the same cost score", () => {
    const solver = new ComparativeSolver();
    const results = [
      { algorithm: "dijkstra", success: true, result: { path: ["A", "B"], cost: 3, nodesExplored: 8 } },
      { algorithm: "astar", success: true, result: { path: ["A", "C"], cost: 3, nodesExplored: 12 } },
    ];

    const comparison = solver.compareResults(results, {
      weights: { cost: 1 },
    });

    // Equal costs collapse the range, so the cost term contributes the same
    // score to both candidates.
    expect(comparison.weightedRanking[0].score).toBe(comparison.weightedRanking[1].score);
  });
});