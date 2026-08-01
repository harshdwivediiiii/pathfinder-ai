import "server-only";
import { DijkstraAlgorithm } from "./dijkstra.js";

export class DynamicRePlanner {
  constructor(graph, options = {}) {
    this.graph = graph;
    this.warmStartCache = new Map();
    this.debounceMs = options.debounceMs ?? 500;
    this.maxBatchDelayMs = options.maxBatchDelayMs ?? 2000;
    this.replanQueue = [];
    this.pendingTimeout = null;
    this.changeListeners = [];
  }

  onGraphChange(change) {
    this.changeListeners.forEach((listener) => listener(change));

    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }

    this.replanQueue.push(change);

    this.pendingTimeout = setTimeout(() => {
      this.processReplanQueue();
    }, this.debounceMs);
  }

  async processReplanQueue() {
    if (this.replanQueue.length === 0) return;

    const batch = [...this.replanQueue];
    this.replanQueue = [];

    const affectedAgents = this.identifyAffectedAgents(batch);

    for (const agent of affectedAgents) {
      await this.replanAgent(agent, batch);
    }

    return {
      processed: batch.length,
      agentsReplanned: affectedAgents.length,
      changes: batch.map((c) => c.type),
    };
  }

  identifyAffectedAgents(changes) {
    const affectedNodeSet = new Set();
    const affectedEdgeSet = new Set();

    for (const change of changes) {
      switch (change.type) {
        case "node-added":
        case "node-removed":
          affectedNodeSet.add(change.node);
          break;
        case "edge-weight-changed":
          affectedEdgeSet.add(change.from);
          affectedEdgeSet.add(change.to);
          break;
        case "edge-blocked":
          affectedEdgeSet.add(change.from);
          affectedEdgeSet.add(change.to);
          affectedNodeSet.add(change.from);
          affectedNodeSet.add(change.to);
          break;
        case "edge-unblocked":
          affectedEdgeSet.add(change.from);
          affectedEdgeSet.add(change.to);
          break;
      }
    }

    return { affectedNodeSet, affectedEdgeSet };
  }

  async replanAgent(agent, changes) {
    const warmStart = this.warmStartCache.get(agent.id);
    const dijkstra = new DijkstraAlgorithm();
    dijkstra.initialize(this.graph, agent.constraints);

    if (warmStart) {
      return this.replanWithWarmStart(dijkstra, agent, warmStart, changes);
    }

    const result = dijkstra.solve(agent.start, agent.goal);

    if (result.path.length > 0) {
      agent.currentPath = result.path;
      agent.status = "replanned";
      this.warmStartCache.set(agent.id, result);
    }

    return result;
  }

  replanWithWarmStart(dijkstra, agent, previousResult, changes) {
    const previousPath = previousResult.path;
    const affectedSegment = this.findAffectedSegment(previousPath, changes);

    if (!affectedSegment) {
      return previousResult;
    }

    const { prefix, suffix } = this.splitPathAtSegment(previousPath, affectedSegment);
    const startNode = prefix.length > 0 ? prefix[prefix.length - 1] : agent.start;
    const endNode = suffix.length > 0 ? suffix[0] : agent.goal;

    let newSegment;
    try {
      newSegment = dijkstra.solve(startNode, endNode);
    } catch {
      return previousResult;
    }

    if (newSegment.path.length === 0) {
      return previousResult;
    }

    const newPath = [...prefix, ...newSegment.path.slice(1), ...suffix.slice(1)];

    return {
      path: newPath,
      cost: previousResult.cost + newSegment.cost,
      nodesExplored: previousResult.nodesExplored + newSegment.nodesExplored,
      timeMs: previousResult.timeMs,
      metadata: {
        ...previousResult.metadata,
        warmStartUsed: true,
        replannedSegment: affectedSegment,
      },
    };
  }

  findAffectedSegment(path, changes) {
    if (!path || path.length < 2) return null;

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      for (const change of changes) {
        if (change.type === "edge-blocked" && change.from === from && change.to === to) {
          return { start: i, end: i + 1 };
        }
        if (change.type === "edge-weight-changed" && change.from === from && change.to === to) {
          return { start: i, end: i + 1 };
        }
        if (change.type === "node-removed" && (change.node === from || change.node === to)) {
          return { start: i, end: i + 1 };
        }
      }
    }

    return null;
  }

  splitPathAtSegment(path, segment) {
    const prefix = path.slice(0, segment.start + 1);
    const suffix = path.slice(segment.end);
    return { prefix, suffix };
  }

  batchChanges(change) {
    this.replanQueue.push(change);

    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }

    this.pendingTimeout = setTimeout(() => {
      this.processReplanQueue();
    }, this.maxBatchDelayMs);
  }

  getCacheStats() {
    return {
      cacheSize: this.warmStartCache.size,
      pendingReplans: this.replanQueue.length,
      debounceMs: this.debounceMs,
      maxBatchDelayMs: this.maxBatchDelayMs,
    };
  }

  invalidateAgentCache(agentId) {
    this.warmStartCache.delete(agentId);
  }

  invalidateAllCache() {
    this.warmStartCache.clear();
  }
}

export function createReplanner(graph, options) {
  return new DynamicRePlanner(graph, options);
}