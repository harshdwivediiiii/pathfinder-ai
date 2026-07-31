export class WarehouseCBSRouter {
  constructor() {
    // Stores reservations: "nodeId_timestamp" => agentId
    this.reservationTable = new Map();
  }

  // Clear all reservations
  clearReservations() {
    this.reservationTable.clear();
  }

  // Check if a node is available at a specific timestamp
  isNodeAvailable(nodeId, timestamp) {
    return !this.reservationTable.has(`${nodeId}_${timestamp}`);
  }

  // Reserve a node for a specific agent at a specific timestamp
  reserveNode(nodeId, timestamp, agentId) {
    this.reservationTable.set(`${nodeId}_${timestamp}`, agentId);
  }

  // Simplified space-time A* for a single agent
  routeAgent(graph, startId, endId, startTime = 0, agentId = 'agent') {
    // Priority queue queue for BFS/A*. Since edge costs are uniform (time steps = 1), a simple queue works as BFS
    // For A* we would use a proper priority queue, but for this simplified implementation array sort works.
    let openSet = [{
      node: startId,
      time: startTime,
      path: [{ node: startId, time: startTime }],
      cost: 0
    }];

    // Visited set specific to state: (nodeId, time)
    const visited = new Set();

    while (openSet.length > 0) {
      // Sort to get lowest cost (A* behavior with h(n) = 0, so essentially Dijkstra)
      openSet.sort((a, b) => a.cost - b.cost);
      const current = openSet.shift();
      const stateKey = `${current.node}_${current.time}`;

      if (current.node === endId) {
        // Path found! Reserve the path nodes.
        current.path.forEach(step => {
          this.reserveNode(step.node, step.time, agentId);
        });
        return { status: 'success', path: current.path };
      }

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      // We don't want to wait indefinitely. Add an arbitrary max wait threshold.
      if (current.time - startTime > 100) continue;

      // 1. Can the agent WAIT at its current location?
      const nextTime = current.time + 1;
      if (this.isNodeAvailable(current.node, nextTime)) {
        // Prevent edge collision where robots swap places in a hallway (nodeA -> nodeB while nodeB -> nodeA)
        // A simple wait is usually safe unless someone else is scheduled to arrive at our node.
        openSet.push({
          node: current.node,
          time: nextTime,
          path: [...current.path, { node: current.node, time: nextTime }],
          cost: current.cost + 1
        });
      }

      // 2. Can the agent MOVE to adjacent locations?
      const edges = graph.edges[current.node] || [];
      for (const neighbor of edges) {
        if (this.isNodeAvailable(neighbor, nextTime)) {
          // Check for edge collision (swapping places)
          // If another agent is at `neighbor` at `current.time`, and moves to `current.node` at `nextTime`, it's a collision.
          const otherAgentAtNeighborNow = this.reservationTable.get(`${neighbor}_${current.time}`);
          const otherAgentAtMyNodeNext = this.reservationTable.get(`${current.node}_${nextTime}`);
          
          if (otherAgentAtNeighborNow && otherAgentAtNeighborNow === otherAgentAtMyNodeNext) {
            // Edge collision! Skip this move.
            continue;
          }

          openSet.push({
            node: neighbor,
            time: nextTime,
            path: [...current.path, { node: neighbor, time: nextTime }],
            cost: current.cost + 1
          });
        }
      }
    }

    return { status: 'no_path_found', path: [] };
  }

  // Route multiple agents sequentially (Prioritized Planning approach)
  routeMultipleAgents(graph, agents) {
    this.clearReservations();
    const results = {};

    // Sort agents by priority if provided, otherwise standard order
    const sortedAgents = [...agents].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const agent of sortedAgents) {
      const result = this.routeAgent(graph, agent.startId, agent.endId, agent.startTime || 0, agent.id);
      results[agent.id] = result;
    }

    return results;
  }
}
