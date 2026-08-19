import { Algorithm, PathResult } from './algorithm-interface.js';
import { MinPriorityQueue } from './priority-queue.js';

export class DijkstraAlgorithm extends Algorithm {
  constructor() {
    super('Dijkstra', {
      completeness: true,
      optimality: true,
      timeComplexity: 'O((V + E) log V)',
      spaceComplexity: 'O(V)',
      supportsHeuristics: false,
      supportsMultiObjective: false,
      supportsDynamicUpdates: false,
    });
  }

  solve(graph, start, goal, options = {}) {
    const startTime = performance.now();
    const nodesExplored = { count: 0 };

    const distances = new Map();
    const previous = new Map();
    const visited = new Set();
    const priorityQueue = new MinPriorityQueue();

    distances.set(start, 0);
    priorityQueue.enqueue(start, 0);

    while (!priorityQueue.isEmpty()) {
      const { element: current, priority: currentDist } = priorityQueue.dequeue();
      nodesExplored.count++;

      if (visited.has(current)) continue;
      visited.add(current);

      if (current === goal) {
        const path = this.reconstructPath(previous, start, goal);
        return new PathResult({
          path,
          cost: currentDist,
          nodesExplored: nodesExplored.count,
          timeMs: performance.now() - startTime,
          metadata: { algorithm: 'dijkstra', graphType: graph.type || 'general' },
        });
      }

      const neighbors = graph.getNeighbors?.(current) ?? [];
      for (const { node, weight } of neighbors) {
        if (visited.has(node)) continue;

        const newDist = currentDist + weight;
        if (!distances.has(node) || newDist < distances.get(node)) {
          distances.set(node, newDist);
          previous.set(node, current);
          priorityQueue.enqueue(node, newDist);
        }
      }
    }

    return new PathResult({
      path: [],
      cost: Infinity,
      nodesExplored: nodesExplored.count,
      timeMs: performance.now() - startTime,
      metadata: { algorithm: 'dijkstra', graphType: graph.type || 'general', noPath: true },
    });
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