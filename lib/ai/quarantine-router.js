export class QuarantineRouter {
  /**
   * @param {number} contaminationWindowMinutes How long a node remains "dirty" after a DIRTY vehicle passes.
   */
  constructor(contaminationWindowMinutes = 60) {
    this.contaminationWindow = contaminationWindowMinutes;
    // Stores spatial-temporal ledger:
    // "nodeId" => [{ timestamp, vehicleType }, ...]
    this.contaminationLog = new Map();
  }

  // Clear the log for testing or new cycles
  clearLog() {
    this.contaminationLog.clear();
  }

  /**
   * Manually logs a vehicle's path through the graph at specific timestamps.
   * Useful for pre-loading the environment with known DIRTY waste truck routes.
   */
  logVehiclePath(pathNodes, timestamps, vehicleType) {
    for (let i = 0; i < pathNodes.length; i++) {
      const nodeId = pathNodes[i].id;
      const time = timestamps[i];
      
      if (!this.contaminationLog.has(nodeId)) {
        this.contaminationLog.set(nodeId, []);
      }
      this.contaminationLog.get(nodeId).push({ timestamp: time, vehicleType });
    }
  }

  /**
   * Checks if a node is safe for a given vehicle type at a specific time.
   */
  isNodeSafe(nodeId, timestamp, vehicleType) {
    // If the requesting vehicle is DIRTY, it doesn't care if a CLEAN vehicle was there (unfortunately for the clean vehicle, but the dirty one isn't blocked).
    // However, to enforce strict isolation, we might just prevent them crossing entirely.
    // The main constraint: CLEAN vehicles CANNOT enter a node if a DIRTY vehicle was there within the contamination window.
    
    const logs = this.contaminationLog.get(nodeId) || [];
    
    for (const log of logs) {
      if (vehicleType === 'CLEAN' && log.vehicleType === 'DIRTY') {
        // If the dirty vehicle was here before us, but within the contamination window
        if (timestamp >= log.timestamp && timestamp <= log.timestamp + this.contaminationWindow) {
          return false; // Node is heavily contaminated
        }
      }

      // We should also prevent DIRTY vehicles from entering a node if a CLEAN vehicle is currently there,
      // or will be there. Let's assume strict separation: they cannot occupy the node at the EXACT same time,
      // and DIRTY cannot contaminate a node shortly *before* a CLEAN vehicle arrives (handled above).
      if (log.timestamp === timestamp && log.vehicleType !== vehicleType) {
        return false; // Exact simultaneous collision of different classes
      }
    }

    return true; // Safe
  }

  /**
   * Routes a fleet vehicle prioritizing time while strictly obeying contamination constraints.
   */
  routeFleet(graph, startId, endId, startTime = 0, vehicleType = 'CLEAN') {
    // Simplified BFS/A* over time
    let openSet = [{
      node: startId,
      time: startTime,
      path: [{ node: startId, time: startTime }],
      cost: 0
    }];

    const visited = new Set(); // State: nodeId_timestamp

    while (openSet.length > 0) {
      // Sort to simulate priority queue (minimize time/cost)
      openSet.sort((a, b) => a.cost - b.cost);
      const current = openSet.shift();
      const stateKey = `${current.node}_${current.time}`;

      if (current.node === endId) {
        // Found safe path
        return { status: 'success', path: current.path };
      }

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      // Max wait threshold to prevent infinite loops if trapped
      if (current.time - startTime > 300) continue; 

      // 1. Action: WAIT at current node (1 minute)
      // (Assuming the current node remains safe)
      const nextTime = current.time + 1;
      if (this.isNodeSafe(current.node, nextTime, vehicleType)) {
        openSet.push({
          node: current.node,
          time: nextTime,
          path: [...current.path, { node: current.node, time: nextTime }],
          cost: current.cost + 1
        });
      }

      // 2. Action: MOVE to adjacent node (Assume 1 minute per edge for simplicity)
      const edges = graph.edges[current.node] || [];
      for (const neighbor of edges) {
        if (this.isNodeSafe(neighbor, nextTime, vehicleType)) {
          openSet.push({
            node: neighbor,
            time: nextTime,
            path: [...current.path, { node: neighbor, time: nextTime }],
            cost: current.cost + 1
          });
        }
      }
    }

    return { status: 'no_safe_path', path: [] };
  }
}
