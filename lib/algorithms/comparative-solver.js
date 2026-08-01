import "server-only";
import { DijkstraAlgorithm } from './dijkstra.js';
import { AStarAlgorithm } from './astar.js';
import { BidirectionalBFSAlgorithm } from './bidirectional-bfs.js';
import { YenKShortestAlgorithm } from './yen-kshortest.js';

const ALGORITHM_REGISTRY = new Map([
  ['dijkstra', { create: () => new DijkstraAlgorithm() }],
  ['astar', { create: () => new AStarAlgorithm() }],
  ['bidirectional-bfs', { create: () => new BidirectionalBFSAlgorithm() }],
  ['yen-k-shortest', { create: () => new YenKShortestAlgorithm(3) }],
]);

function runAlgorithmInWorker(algorithmName, graph, start, goal, options) {
  const factory = ALGORITHM_REGISTRY.get(algorithmName);
  if (!factory) throw new Error(`Unknown algorithm: ${algorithmName}`);
  const algo = factory.create();
  algo.initialize(graph, options.constraints);
  return algo.solve(graph, start, goal, options);
}

export class AlgorithmRegistry {
  static register(name, factory) {
    ALGORITHM_REGISTRY.set(name, { create: factory });
  }

  static getNames() {
    return Array.from(ALGORITHM_REGISTRY.keys());
  }

  static getMetadata(name) {
    const factory = ALGORITHM_REGISTRY.get(name);
    if (!factory) return null;
    const algo = factory.create();
    return algo.getComplexity();
  }

  static getAllMetadata() {
    const metadata = {};
    for (const [name] of ALGORITHM_REGISTRY) {
      metadata[name] = this.getMetadata(name);
    }
    return metadata;
  }
}

export class ComparativeSolver {
  constructor(algorithmNames = ['dijkstra', 'astar', 'bidirectional-bfs']) {
    this.algorithmNames = algorithmNames;
    this.resultsCache = new Map();
  }

  setAlgorithms(names) {
    this.algorithmNames = names;
    return this;
  }

  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    return this;
  }

  solve(graph, start, goal, options = {}) {
    const cacheKey = this.getCacheKey(graph, start, goal, options);

    if (this.cacheEnabled && this.resultsCache.has(cacheKey)) {
      return this.resultsCache.get(cacheKey);
    }

    const results = this.algorithmNames.map((name) => {
      const algoStart = performance.now();
      try {
        const result = runAlgorithmInWorker(name, graph, start, goal, options);
        return {
          algorithm: name,
          success: true,
          result,
          durationMs: performance.now() - algoStart,
        };
      } catch (error) {
        return {
          algorithm: name,
          success: false,
          error: error.message,
          durationMs: performance.now() - algoStart,
        };
      }
    });

    const comparison = this.compareResults(results, options);

    const output = {
      problem: { start, goal, algorithmCount: this.algorithmNames.length },
      results: results.map((r) => ({
        algorithm: r.algorithm,
        success: r.success,
        path: r.success ? r.result.path : [],
        cost: r.success ? r.result.cost : Infinity,
        nodesExplored: r.success ? r.result.nodesExplored : 0,
        durationMs: r.durationMs,
        metadata: r.success ? r.result.metadata : null,
      })),
      comparison,
      cacheHit: false,
    };

    if (this.cacheEnabled) {
      this.resultsCache.set(cacheKey, output);
    }

    return output;
  }

  compareResults(results, options = {}) {
    const weights = options.weights ?? {
      cost: 0.4,
      safety: 0.2,
      speed: 0.2,
      scenic: 0.1,
      risk: 0.1,
    };

    const scored = results
      .filter((r) => r.success)
      .map((r) => {
        const score = this.weightedCompositeScore(r.result, weights);
        return { algorithm: r.algorithm, score, path: r.result.path, cost: r.result.cost };
      })
      .sort((a, b) => b.score - a.score);

    const paretoFrontier = this.computeParetoFrontier(results.filter((r) => r.success));

    return {
      weightedRanking: scored,
      paretoFrontier: paretoFrontier.map((r) => ({
        algorithm: r.algorithm,
        path: r.result.path,
        cost: r.result.cost,
        nodesExplored: r.result.nodesExplored,
      })),
      bestOverall: scored.length > 0 ? scored[0] : null,
      weights,
    };
  }

  weightedCompositeScore(result, weights) {
    const safeCost = isFinite(result.cost) ? result.cost : 999999;
    const maxCost = Math.max(safeCost, 1);
    const costScore = Math.max(0, 1 - safeCost / maxCost);
    const explorationBonus = Math.max(0, 1 - result.nodesExplored / 10000);

    return (
      (weights.cost ?? 0) * costScore +
      (weights.exploration ?? 0) * explorationBonus +
      (weights.safety ?? 0) * 0.5 +
      (weights.speed ?? 0) * costScore +
      (weights.scenic ?? 0) * 0.3 +
      (weights.risk ?? 0) * (1 - costScore)
    );
  }

  computeParetoFrontier(results) {
    const points = results.map((r) => ({
      algorithm: r.algorithm,
      result: r.result,
      cost: r.result.cost,
      nodesExplored: r.result.nodesExplored,
    }));

    const pareto = [];
    for (const p of points) {
      let dominated = false;
      for (const q of points) {
        if (q.cost <= p.cost && q.nodesExplored <= p.nodesExplored && (q.cost < p.cost || q.nodesExplored < p.nodesExplored)) {
          dominated = true;
          break;
        }
      }
      if (!dominated) {
        pareto.push(p);
      }
    }

    return pareto;
  }

  getCacheKey(graph, start, goal, options) {
    const graphKey = graph.type ?? 'default';
    return `${graphKey}:${start}:${goal}:${JSON.stringify(options)}`;
  }

  invalidateCache(pattern) {
    if (!pattern) {
      this.resultsCache.clear();
      return;
    }

    for (const key of this.resultsCache.keys()) {
      if (key.includes(pattern)) {
        this.resultsCache.delete(key);
      }
    }
  }
}

export function createDefaultSolver() {
  return new ComparativeSolver();
}