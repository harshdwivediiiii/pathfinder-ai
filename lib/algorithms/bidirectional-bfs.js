import { Algorithm, PathResult } from './algorithm-interface.js';

export class BidirectionalBFSAlgorithm extends Algorithm {
  constructor() {
    super('Bidirectional BFS', {
      completeness: true,
      optimality: true,
      timeComplexity: 'O(b^(d/2)) where b=branching factor, d=depth',
      spaceComplexity: 'O(b^(d/2))',
      supportsHeuristics: false,
      supportsMultiObjective: false,
      supportsDynamicUpdates: false,
    });
  }

  solve(graph, start, goal, options = {}) {
    const startTime = performance.now();
    const nodesExplored = { count: 0 };

    if (start === goal) {
      return new PathResult({
        path: [start],
        cost: 0,
        nodesExplored: 0,
        timeMs: performance.now() - startTime,
        metadata: { algorithm: 'bidirectional-bfs' },
      });
    }

    const forwardVisited = new Map([[start, null]]);
    const backwardVisited = new Map([[goal, null]]);
    const forwardQueue = [start];
    const backwardQueue = [goal];
    let intersection = null;

    while (forwardQueue.length > 0 || backwardQueue.length > 0) {
      const meetInForward = this.expandLevel(graph, forwardQueue, forwardVisited, backwardVisited, nodesExplored, 'forward');
      if (meetInForward) {
        intersection = meetInForward;
        break;
      }

      const meetInBackward = this.expandLevel(graph, backwardQueue, backwardVisited, forwardVisited, nodesExplored, 'backward');
      if (meetInBackward) {
        intersection = meetInBackward;
        break;
      }
    }

    const path = intersection
      ? this.buildPath(forwardVisited, backwardVisited, intersection)
      : [];
    const cost = path.length > 0 ? path.length - 1 : Infinity;

    return new PathResult({
      path,
      cost,
      nodesExplored: nodesExplored.count,
      timeMs: performance.now() - startTime,
      metadata: { algorithm: 'bidirectional-bfs', intersection: !!intersection },
    });
  }

  expandLevel(graph, queue, thisVisited, otherVisited, counter, direction) {
    const nextQueue = [];
    const maxExpand = queue.length;

    for (let i = 0; i < maxExpand; i++) {
      const current = queue.shift();
      counter.count++;

      const neighbors = graph.getNeighbors?.(current) ?? [];
      for (const { node } of neighbors) {
        if (thisVisited.has(node)) continue;

        thisVisited.set(node, current);
        nextQueue.push(node);

        if (otherVisited.has(node)) {
          return node;
        }
      }
    }

    queue.push(...nextQueue);
    return null;
  }

  buildPath(forwardVisited, backwardVisited, intersection) {
    const forwardPath = [];
    let current = intersection;
    while (current !== null) {
      forwardPath.unshift(current);
      current = forwardVisited.get(current);
    }

    const backwardPath = [];
    current = backwardVisited.get(intersection);
    while (current !== null) {
      backwardPath.push(current);
      current = backwardVisited.get(current);
    }

    return [...forwardPath, ...backwardPath];
  }
}