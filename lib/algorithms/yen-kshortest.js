import { Algorithm, PathResult } from './algorithm-interface.js';
import { DijkstraAlgorithm } from './dijkstra.js';

export class YenKShortestAlgorithm extends Algorithm {
  constructor(k = 3) {
    super(`Yen's K-Shortest (k=${k})`, {
      completeness: true,
      optimality: true,
      timeComplexity: `O(k * V * (E + V log V))`,
      spaceComplexity: 'O(k * V)',
      supportsHeuristics: false,
      supportsMultiObjective: false,
      supportsDynamicUpdates: false,
      k,
    });
    this.k = k;
  }

  setK(k) {
    this.k = k;
    this.metadata.k = k;
    this.name = `Yen's K-Shortest (k=${k})`;
    return this;
  }

  solve(graph, start, goal, options = {}) {
    const startTime = performance.now();
    const dijkstra = new DijkstraAlgorithm();
    const k = this.k;

    const A = [];
    const B = new MinPriorityQueue();

    const firstResult = dijkstra.solve(graph, start, goal, options);
    A.push(firstResult);

    if (firstResult.path.length === 0) {
      return firstResult;
    }

    for (let i = 1; i < k; i++) {
      const prevPath = A[i - 1].path;
      if (!prevPath || prevPath.length === 0) break;

      for (let j = 0; j < prevPath.length - 1; j++) {
        const spurNode = prevPath[j];
        const rootPath = prevPath.slice(0, j + 1);

        const removedEdges = [];
        for (const path of A) {
          if (path.path.length > j && arraysEqual(path.path.slice(0, j + 1), rootPath)) {
            const u = path.path[j];
            const v = path.path[j + 1];
            const neighbors = graph.getNeighbors?.(u);
            if (neighbors) {
              const idx = neighbors.findIndex((n) => n.node === v);
              if (idx !== -1) {
                removedEdges.push({ node: u, neighbor: neighbors[idx] });
                graph.removeNeighbor?.(u, v);
              }
            }
          }
        }

        const spurResult = dijkstra.solve(graph, spurNode, goal, options);

        for (const edge of removedEdges) {
          graph.addNeighbor?.(edge.node, edge.neighbor);
        }

        if (spurResult.path.length > 0 && !this.pathExistsIn(A, spurResult.path)) {
          const totalPath = [...rootPath, ...spurResult.path.slice(1)];
          const totalCost = this.calculatePathCost(graph, totalPath);
          B.enqueue({ path: totalPath, cost: totalCost }, totalCost);
        }
      }

      if (B.isEmpty()) break;

      const candidate = B.dequeue();
      A.push(new PathResult({
        path: candidate.element.path,
        cost: candidate.element.cost,
        nodesExplored: 0,
        timeMs: 0,
        metadata: { algorithm: 'yen-k-shortest', iteration: i },
      }));
    }

    const bestResult = A[0];
    return new PathResult({
      path: bestResult.path,
      cost: bestResult.cost,
      nodesExplored: A.reduce((sum, r) => sum + r.nodesExplored, 0),
      timeMs: performance.now() - startTime,
      metadata: {
        algorithm: 'yen-k-shortest',
        k: this.k,
        pathsFound: A.length,
        allPaths: A.map((r) => r.toJSON()),
      },
    });
  }

  pathExistsIn(paths, path) {
    return paths.some((p) => arraysEqual(p.path, path));
  }

  calculatePathCost(graph, path) {
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const neighbors = graph.getNeighbors?.(path[i]) ?? [];
      const edge = neighbors.find((n) => n.node === path[i + 1]);
      cost += edge?.weight ?? Infinity;
    }
    return cost;
  }
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }

  enqueue(element, priority) {
    this.heap.push({ element, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].priority <= this.heap[index].priority) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < length && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}