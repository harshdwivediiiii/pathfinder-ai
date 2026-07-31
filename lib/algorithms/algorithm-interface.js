export class Algorithm {
  constructor(name, metadata = {}) {
    this.name = name;
    this.metadata = {
      completeness: true,
      optimality: true,
      timeComplexity: 'O(E log V)',
      spaceComplexity: 'O(V)',
      supportsHeuristics: false,
      supportsMultiObjective: false,
      supportsDynamicUpdates: false,
      ...metadata,
    };
    this.graph = null;
    this.constraints = null;
    this.solver = null;
  }

  initialize(graph, constraints = {}) {
    this.graph = graph;
    this.constraints = constraints;
    return this;
  }

  solve(start, goal, options = {}) {
    throw new Error('solve() must be implemented by subclass');
  }

  getName() {
    return this.name;
  }

  getComplexity() {
    return this.metadata;
  }

  getSupportedFeatures() {
    return this.metadata;
  }
}

export class PathResult {
  constructor({ path = [], cost = 0, nodesExplored = 0, timeMs = 0, metadata = {} }) {
    this.path = path;
    this.cost = cost;
    this.nodesExplored = nodesExplored;
    this.timeMs = timeMs;
    this.metadata = metadata;
  }

  toJSON() {
    return {
      path: this.path,
      cost: this.cost,
      nodesExplored: this.nodesExplored,
      timeMs: this.timeMs,
      metadata: this.metadata,
    };
  }
}