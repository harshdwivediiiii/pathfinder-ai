import { auth } from "@clerk/nextjs/server";
import { ComparativeSolver, AlgorithmRegistry } from "@/lib/algorithms";
import { Agent, MultiAgentCoordinator } from "@/lib/algorithms/agent-engine";
import { DynamicRePlanner } from "@/lib/algorithms/dynamic-replan";
import { db } from "@/lib/db/prisma";
import { respondError, ERROR_CODES } from "@/lib/api/error-handler";

export async function compareAlgorithms(data) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED, "Authentication required");
    }

    const { graph, start, goal, algorithms, constraints, options = {} } = data;

    if (!graph || !start || !goal) {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Missing required parameters: graph, start, goal");
    }

    const algorithmNames = algorithms ?? ["dijkstra", "astar", "bidirectional-bfs"];

    for (const name of algorithmNames) {
      if (!AlgorithmRegistry.getNames().includes(name)) {
        return respondError(
          ERROR_CODES.VALIDATION_ERROR,
          `Unknown algorithm: ${name}. Available: ${AlgorithmRegistry.getNames().join(", ")}`
        );
      }
    }

    const solver = new ComparativeSolver(algorithmNames);
    solver.setCacheEnabled(options.cacheEnabled ?? true);

    const result = solver.solve(graph, start, goal, {
      constraints,
      weights: options.weights,
    });

    if (options.saveToDatabase ?? false) {
      await db.pathfindingSession.create({
        data: {
          userId,
          name: options.sessionName ?? `Pathfinding ${start} → ${goal}`,
          algorithmType: algorithmNames.join(","),
          status: "active",
          metadata: { graphType: graph.type, start, goal, options },
        },
      });
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return respondError(ERROR_CODES.INTERNAL_ERROR, error.message);
  }
}

export async function coordinateAgents(data) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED, "Authentication required");
    }

    const { graph, agents, options = {} } = data;

    if (!graph || !agents || agents.length < 2) {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "At least 2 agents required for coordination");
    }

    const coordinator = new MultiAgentCoordinator(graph, {
      maxIterations: options.maxIterations ?? 50,
      resolutionStrategy: options.resolutionStrategy ?? "priority-based",
    });

    for (const agentData of agents) {
      const agent = new Agent(
        agentData.id,
        agentData.start,
        agentData.goal,
        agentData.constraints ?? {},
        agentData.objectives ?? {},
        agentData.priority ?? 0
      );
      coordinator.addAgent(agent);
    }

    const result = await coordinator.coordinate();

    return {
      success: true,
      data: {
        converged: result.converged,
        iterations: result.iterations,
        agentStates: result.agents,
        history: result.history,
      },
    };
  } catch (error) {
    return respondError(ERROR_CODES.INTERNAL_ERROR, error.message);
  }
}

export async function dynamicReplan(data) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED, "Authentication required");
    }

    const { graph, agentId, changes, agentState } = data;

    if (!graph || !agentId || !changes) {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Missing required parameters");
    }

    const replanner = new DynamicRePlanner(graph, {
      debounceMs: Number.parseInt(process.env.REPLAN_DEBOUNCE_MS ?? "500", 10),
      maxBatchDelayMs: Number.parseInt(process.env.REPLAN_MAX_BATCH_MS ?? "2000", 10),
    });

    const agent = {
      id: agentId,
      start: agentState?.start ?? graph.defaultStart,
      goal: agentState?.goal ?? graph.defaultGoal,
      constraints: agentState?.constraints ?? {},
      currentPath: agentState?.currentPath ?? [],
      status: "active",
    };

    replanner.setAgents([agent]);

    replanner.onGraphChange({ type: "batch", changes });
    const result = await replanner.processReplanQueue();
    if (replanner.pendingTimeout) {
      clearTimeout(replanner.pendingTimeout);
    }

    return {
      success: true,
      data: {
        result,
        cacheStats: replanner.getCacheStats(),
      },
    };
  } catch (error) {
    return respondError(ERROR_CODES.INTERNAL_ERROR, error.message);
  }
}