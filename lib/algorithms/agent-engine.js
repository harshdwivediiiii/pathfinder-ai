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
        agent.currentPath = this.planPath(agent);
        iterationResult.agentStates[id] = {
          pathLength: agent.currentPath.length,
          status: agent.status,
          conflicts: agent.conflicts.length,
        };
      }

      const conflicts = this.detectConflicts();
      iterationResult.conflicts = conflicts;

      if (conflicts.length === 0) {
        this.converged = true;
        break;
      }

      await this.resolveConflicts(conflicts);
      history.push(iterationResult);

      const allResolved = conflicts.every((c) => c.resolved);
      if (allResolved && this.iteration > 1) {
        this.converged = true;
      }
    }

    return {
      converged: this.converged,
      iterations: this.iteration,
      history,
      agents: this.getAgentStates(),
    };
  }

  planPath(agent) {
    const dijkstra = new DijkstraAlgorithm();
    dijkstra.initialize(this.graph, agent.constraints);
    const result = dijkstra.solve(this.graph, agent.start, agent.goal);
    return result.path;
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

    const newPath = this.replanForAgent(lowPriority, highPriority.currentPath);
    if (newPath.length > 0) {
      lowPriority.currentPath = newPath;
      lowPriority.status = 'replanned';
    }

    conflict.resolved = true;
  }

  async resolveByTimeSlot(conflict) {
    const [idA, idB] = conflict.agents;
    const agentA = this.agents.get(idA);
    const agentB = this.agents.get(idB);

    const offset = Math.floor(Math.random() * 3) + 1;
    agentB.currentPath = [...Array(offset).fill(null), ...agentB.currentPath];
    agentB.status = 'time-offset';
    conflict.resolved = true;
  }

  async resolveByNegotiation(conflict) {
    const [idA, idB] = conflict.agents;
    const agentA = this.agents.get(idA);
    const agentB = this.agents.get(idB);

    const dijkstra = new DijkstraAlgorithm();
    dijkstra.initialize(this.graph, { ...agentA.constraints, ...agentB.constraints });
    const result = dijkstra.solve(this.graph, agentA.start, agentA.goal);

    if (result.path.length > 0) {
      agentA.currentPath = result.path;
      agentA.status = 'replanned';
    }

    conflict.resolved = true;
  }

  replanForAgent(agent, blockedPath) {
    const blockedNodes = new Set(blockedPath);
    const dijkstra = new DijkstraAlgorithm();

    const constrainedGraph = {
      ...this.graph,
      getNeighbors: (node) => {
        const neighbors = this.graph.getNeighbors?.(node) ?? [];
        return neighbors.filter((n) => !blockedNodes.has(n.node));
      },
    };

    dijkstra.initialize(constrainedGraph, agent.constraints);
    const result = dijkstra.solve(constrainedGraph, agent.start, agent.goal);
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