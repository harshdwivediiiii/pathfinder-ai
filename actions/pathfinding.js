"use server";

export async function compareAlgorithms(body) {
  const { graph, start, goal, algorithms = ["A*", "Dijkstra"] } = body;
  if (!graph || !start || !goal) throw new Error("compareAlgorithms requires graph, start, and goal");
  return { graph, start, goal, results: algorithms.map((n) => ({ algorithm: n, path: null, cost: null, exploredNodes: 0, status: "pending" })), bestPath: null, timestamp: new Date().toISOString() };
}

export async function coordinateAgents(body) {
  const { graph, agents = [] } = body;
  if (!graph || !Array.isArray(agents)) throw new Error("coordinateAgents requires graph and agents array");
  return { graph, agents: agents.map((a) => ({ id: a.id ?? null, status: "idle", assignedPath: null })), coordination: { totalAgents: agents.length, status: "idle" }, timestamp: new Date().toISOString() };
}

export async function dynamicReplan(body) {
  const { graph, agentId, changes = [] } = body;
  if (!graph || !agentId) throw new Error("dynamicReplan requires graph and agentId");
  return { agentId, changes, processed: changes.length, agentsReplanned: 0, newPath: null, timestamp: new Date().toISOString() };
}
