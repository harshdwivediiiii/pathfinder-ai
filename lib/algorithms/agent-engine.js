import "server-only";
import { DijkstraAlgorithm } from './dijkstra.js';

export class Agent {
  constructor(id, start, goal, constraints = {}, objectives = {}, priority = 0) {
    this.id = id;
    this.start = start;
    this.goal = goal;
    this.constraints = constraints;
    this.objectives = objectives;
    this.priority = priority;
    this.currentPath = [];
    this.status = 'pending';
    this.conflicts = [];
    this.currentPosition = start;
  }

  updateConstraints(newConstraints) {
    this.constraints = { ...this.constraints, ...newConstraints };
    this.status = 'needs-replan';
    return this;
  }

  addConflict(conflict) {
    this.conflicts.push(conflict);
    return this;
  }

  clearConflicts() {
    this.conflicts = [];
    return this;
  }
}

export class MultiAgentCoordinator {
  constructor(graph, options = {}) {
    this.graph = graph;
    this.agents = new Map();
    this.maxIterations = options.maxIterations ?? 50;
    this.convergenceThreshold = options.convergenceThreshold ?? 0;
    this.resolutionStrategy = options.resolutionStrategy ?? 'priority-based';
    this.iteration = 0;
    this.converged = false;
  }

  addAgent(agent) {
    this.agents.set(agent.id, agent);
    return this;
  }

  removeAgent(agentId) {
    this.agents.delete(agentId);
    return this;
  }

  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  async coordinate() {
    this.iteration = 0;
    this.converged = false;
    const history = [];

    while (!this.converged && this.iteration < this.maxIterations) {
      this.iteration++;
      const iterationResult = { iteration: this.iteration, conflicts: [], agentStates: {} };

      for (const [id, agent] of this.agents) {
        agent.clearConflicts();
        agent.currentPath = this.planPath(agent);
        iterationResult.agentStates[id] = {
          pathLength: agent.currentPath.length,
          status: agent.status,
          conflicts: agent.conflicts.length,
        };
      }

      const conflicts = this.detectConflicts();
      iterationResult.conflicts = conflicts;

      if (conflicts.length === 0 && this.allAgentsHavePath()) {
        this.converged = true;
        break;
      }

      await this.resolveConflicts(conflicts);

      // Re-scan the updated paths instead of trusting the resolution flags, so
      // convergence is only reported when every conflict was genuinely removed.
      for (const [, agent] of this.agents) {
        agent.clearConflicts();
      }
      const remainingConflicts = this.detectConflicts();
      iterationResult.conflicts = remainingConflicts;

      if (remainingConflicts.length === 0 && this.allAgentsHavePath()) {
        this.converged = true;
      }

      history.push(iterationResult);
    }

    return {
      converged: this.converged,
      iterations: this.iteration,
      history,
      agents: this.getAgentStates(),
    };
  }

  planPath(agent) {
    const graph = this.buildConstrainedGraph(agent.constraints);
    const dijkstra = new DijkstraAlgorithm();
    dijkstra.initialize(graph, agent.constraints);
    const result = dijkstra.solve(graph, agent.start, agent.goal);
    return result.path;
  }

  /**
   * Returns a shallow clone of the graph whose getNeighbors filters out any
   * neighbor blocked by the given constraints. Agents without constraints get
   * the unmodified neighbor list.
   */
  buildConstrainedGraph(constraints = {}) {
    const blockedNodes = new Set(constraints.blockedNodes ?? []);
    const blockedEdges = new Set(
      (constraints.blockedEdges ?? []).map((e) => [e.from, e.to].sort().join("|"))
    );
    const originalGetNeighbors = this.graph.getNeighbors;

    return {
      ...this.graph,
      getNeighbors: (node) => {
        const neighbors = originalGetNeighbors?.(node) ?? [];
        return neighbors.filter((n) => {
          if (blockedNodes.has(n.node)) return false;
          if (blockedEdges.has([node, n.node].sort().join("|"))) return false;
          return true;
        });
      },
    };
  }

  allAgentsHavePath() {
    return Array.from(this.agents.values()).every((agent) => agent.currentPath.length > 0);
  }

  detectConflicts() {
    const conflicts = [];
    const agentEntries = Array.from(this.agents.entries());

    for (let i = 0; i < agentEntries.length; i++) {
      for (let j = i + 1; j < agentEntries.length; j++) {
        const [idA, agentA] = agentEntries[i];
        const [idB, agentB] = agentEntries[j];

        const conflict = this.findEdgeConflict(agentA.currentPath, agentB.currentPath, idA, idB);
        if (conflict) {
          conflicts.push(conflict);
          agentA.addConflict(conflict);
          agentB.addConflict(conflict);
        }
      }
    }

    return conflicts;
  }

  findEdgeConflict(pathA, pathB, agentIdA, agentIdB) {
    const edgesA = this.getPathEdges(pathA);
    const edgesB = this.getPathEdges(pathB);

    for (const edgeA of edgesA) {
      for (const edgeB of edgesB) {
        if (edgesConflict(edgeA, edgeB)) {
          return {
            type: 'edge-conflict',
            agents: [agentIdA, agentIdB],
            edgeA,
            edgeB,
            resolved: false,
          };
        }
      }
    }

    const nodesA = new Set(pathA);
    const nodesB = new Set(pathB);
    for (const node of nodesA) {
      if (nodesB.has(node)) {
        return {
          type: 'node-conflict',
          agents: [agentIdA, agentIdB],
          node,
          resolved: false,
        };
      }
    }

    return null;
  }

  getPathEdges(path) {
    const edges = [];
    for (let i = 0; i < path.length - 1; i++) {
      edges.push({ from: path[i], to: path[i + 1] });
    }
    return edges;
  }

  async resolveConflicts(conflicts) {
    for (const conflict of conflicts) {
      switch (this.resolutionStrategy) {
        case 'priority-based':
          await this.resolveByPriority(conflict);
          break;
        case 'time-slot':
          await this.resolveByTimeSlot(conflict);
          break;
        case 'negotiated':
          await this.resolveByNegotiation(conflict);
          break;
        default:
          await this.resolveByPriority(conflict);
      }
    }
  }

  async resolveByPriority(conflict) {
    const [idA, idB] = conflict.agents;
    const agentA = this.agents.get(idA);
    const agentB = this.agents.get(idB);

    const highPriority = agentA.priority >= agentB.priority ? agentA : agentB;
    const lowPriority = agentA.priority >= agentB.priority ? agentB : agentA;

    const blockedNodes = highPriority.currentPath;
    const highEdge = highPriority === agentA ? conflict.edgeA : conflict.edgeB;
    const blockedEdges = conflict.type === "edge-conflict" && highEdge ? [highEdge] : [];
    lowPriority.updateConstraints({ blockedNodes, blockedEdges });

    const newPath = this.replanForAgent(lowPriority, highPriority.currentPath);
    if (newPath.length > 0) {
      const stillConflicting = this.findEdgeConflict(newPath, highPriority.currentPath, lowPriority.id, highPriority.id);
      if (!stillConflicting) {
        lowPriority.currentPath = newPath;
        lowPriority.status = "replanned";
        conflict.resolved = true;
        return;
      }
    }

    conflict.resolved = false;
    lowPriority.status = "blocked";
  }

  async resolveByTimeSlot(conflict) {
    const [idA, idB] = conflict.agents;
    const agentA = this.agents.get(idA);
    const agentB = this.agents.get(idB);

    const previousPath = agentB.currentPath;
    const offset = Math.floor(Math.random() * 3) + 1;
    agentB.currentPath = [...Array(offset).fill(null), ...agentB.currentPath];
    agentB.status = "time-offset";

    const stillConflicting = this.findEdgeConflict(agentA.currentPath, agentB.currentPath, idA, idB);
    if (stillConflicting) {
      agentB.currentPath = previousPath;
      agentB.status = "pending";
      conflict.resolved = false;
      return;
    }

    conflict.resolved = true;
  }

  async resolveByNegotiation(conflict) {
    const [idA, idB] = conflict.agents;
    const agentA = this.agents.get(idA);
    const agentB = this.agents.get(idB);

    const blockedNodes = [...(agentA.constraints.blockedNodes ?? []), ...(agentB.currentPath ?? [])];
    const blockedEdges = [...(agentA.constraints.blockedEdges ?? [])];
    if (conflict.type === "edge-conflict" && conflict.edgeB) {
      blockedEdges.push(conflict.edgeB);
    }
    agentA.updateConstraints({ blockedNodes, blockedEdges });

    const graph = this.buildConstrainedGraph(agentA.constraints);
    const dijkstra = new DijkstraAlgorithm();
    dijkstra.initialize(graph, agentA.constraints);
    const result = dijkstra.solve(graph, agentA.start, agentA.goal);

    if (result.path.length > 0) {
      const stillConflicting = this.findEdgeConflict(result.path, agentB.currentPath, agentA.id, agentB.id);
      if (!stillConflicting) {
        agentA.currentPath = result.path;
        agentA.status = "replanned";
        conflict.resolved = true;
        return;
      }
    }

    conflict.resolved = false;
    agentA.status = "blocked";
  }

  replanForAgent(agent, blockedPath) {
    const blockedNodes = blockedPath ?? [];
    agent.updateConstraints({ blockedNodes });
    const graph = this.buildConstrainedGraph(agent.constraints);

    const dijkstra = new DijkstraAlgorithm();
    dijkstra.initialize(graph, agent.constraints);
    const result = dijkstra.solve(graph, agent.start, agent.goal);
    return result.path;
  }

  getAgentStates() {
    const states = {};
    for (const [id, agent] of this.agents) {
      states[id] = {
        id,
        start: agent.start,
        goal: agent.goal,
        path: agent.currentPath,
        status: agent.status,
        priority: agent.priority,
        conflicts: agent.conflicts.length,
      };
    }
    return states;
  }
}

function edgesConflict(edgeA, edgeB) {
  const sameDirection = edgeA.from === edgeB.from && edgeA.to === edgeB.to;
  const oppositeDirection = edgeA.from === edgeB.to && edgeA.to === edgeB.from;
  return sameDirection || oppositeDirection;
}

export function createCoordinator(graph, options) {
  return new MultiAgentCoordinator(graph, options);
}