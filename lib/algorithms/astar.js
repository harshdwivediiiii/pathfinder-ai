import { Algorithm, PathResult } from './algorithm-interface.js';
import { MinPriorityQueue } from './priority-queue.js';

export class AStarAlgorithm extends Algorithm {
  constructor(heuristic = null) {
    super('A*', {
      completeness: true,
      optimality: true,
      timeComplexity: 'O((V + E) log V)',
      spaceComplexity: 'O(V)',
      supportsHeuristics: true,
      supportsMultiObjective: false,
      supportsDynamicUpdates: false,
    });
    this.heuristic = heuristic;
  }

  setHeuristic(fn) {
    this.heuristic = fn;
    return this;
  }

  solve(graph, start, goal, options = {}) {
    const startTime = performance.now();
    const nodesExplored = { count: 0 };
    const heuristic = this.heuristic ?? this.defaultHeuristic;

    const gScore = new Map();
    const fScore = new Map();
    const previous = new Map();
    const visited = new Set();
    const priorityQueue = new MinPriorityQueue();

    gScore.set(start, 0);
    fScore.set(start, heuristic(start, goal, graph));
    priorityQueue.enqueue(start, fScore.get(start));

    while (!priorityQueue.isEmpty()) {
      const { element: current } = priorityQueue.dequeue();
      nodesExplored.count++;

      if (current === goal) {
        const path = this.reconstructPath(previous, start, goal);
        return new PathResult({
          path,
          cost: gScore.get(goal),
          nodesExplored: nodesExplored.count,
          timeMs: performance.now() - startTime,
          metadata: { algorithm: 'astar', heuristic: heuristic.name ?? 'default' },
        });
      }

      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = graph.getNeighbors?.(current) ?? [];
      for (const { node, weight } of neighbors) {
        if (visited.has(node)) continue;

        const tentativeG = gScore.get(current) + weight;
        if (!gScore.has(node) || tentativeG < gScore.get(node)) {
          previous.set(node, current);
          gScore.set(node, tentativeG);
          fScore.set(node, tentativeG + heuristic(node, goal, graph));
          priorityQueue.enqueue(node, fScore.get(node));
        }
      }
    }

    return new PathResult({
      path: [],
      cost: Infinity,
      nodesExplored: nodesExplored.count,
      timeMs: performance.now() - startTime,
      metadata: { algorithm: 'astar', noPath: true },
    });
  }

  defaultHeuristic(a, b, graph) {
    if (graph.nodeCoords && graph.nodeCoords[a] && graph.nodeCoords[b]) {
      const [x1, y1] = graph.nodeCoords[a];
      const [x2, y2] = graph.nodeCoords[b];
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    return 0;
  }

  reconstructPath(previous, start, goal) {
    const path = [];
    let current = goal;
    while (current !== undefined) {
      path.unshift(current);
      if (current === start) break;
      current = previous.get(current);
    }
    if (path[0] !== start) return [];
    return path;
  }
}