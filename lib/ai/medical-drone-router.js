export class MedicalDroneRouter {
  // Helper to calculate 2D Euclidean distance (in kilometers for urban scale)
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate flight time in minutes
  calculateFlightTime(nodeA, nodeB, droneSpeedKmh) {
    const distanceKm = this.calculateDistance(nodeA, nodeB);
    const timeHours = distanceKm / droneSpeedKmh;
    return timeHours * 60; // Return in minutes
  }

  // Evaluate how critically a hospital needs a specific payload
  evaluateDestination(payload, hospital) {
    let priorityScore = 0;
    
    // Check if the hospital needs this specific payload type
    const demand = hospital.demands?.find(d => d.type === payload.type);
    if (!demand) {
      return 0; // No demand for this payload
    }

    // Base score is the urgency level of the demand
    if (demand.urgency === 'CRITICAL') priorityScore += 1000;
    else if (demand.urgency === 'HIGH') priorityScore += 500;
    else if (demand.urgency === 'MODERATE') priorityScore += 100;
    else priorityScore += 10;
    
    // Add amount needed as a secondary factor
    priorityScore += (demand.amount || 0);

    return priorityScore;
  }

  // Computes flight time along a full path
  calculateTotalFlightTime(pathNodes, droneSpeedKmh) {
    let totalTime = 0;
    for (let i = 0; i < pathNodes.length - 1; i++) {
      totalTime += this.calculateFlightTime(pathNodes[i], pathNodes[i+1], droneSpeedKmh);
    }
    return totalTime;
  }

  routeDrone(graph, startId, payload, droneConfig) {
    let bestHospital = null;
    let bestPath = [];
    let bestScore = -1;
    let bestTime = Infinity;

    // Iterate over all possible paths provided in the graph (or traverse to all hospitals)
    // Assuming graph.paths represents pre-calculated routes to various hospital nodes.
    graph.paths.forEach(pathObj => {
      const endNode = pathObj.nodes[pathObj.nodes.length - 1];
      
      // We only care about paths ending at hospitals
      if (!endNode.isHospital) return;

      const priorityScore = this.evaluateDestination(payload, endNode);
      if (priorityScore === 0) return; // Hospital doesn't need this payload

      const flightTime = this.calculateTotalFlightTime(pathObj.nodes, droneConfig.speedKmh);
      
      // Constraint: Flight time must not exceed payload's cold-chain max transit time
      if (flightTime > payload.maxTransitTimeMinutes) return;

      // Optimization: Select the hospital with the highest priority score
      // If tied, select the one with the shortest flight time
      if (priorityScore > bestScore || (priorityScore === bestScore && flightTime < bestTime)) {
        bestScore = priorityScore;
        bestTime = flightTime;
        bestPath = pathObj.nodes.map(n => n.id);
        bestHospital = endNode.id;
      }
    });

    if (!bestHospital) {
      return { 
        status: 'failed', 
        reason: 'No reachable hospitals needing payload within cold-chain limits.', 
        path: [] 
      };
    }

    return { 
      status: 'success', 
      destination: bestHospital, 
      flightTimeMinutes: bestTime, 
      priorityScore: bestScore,
      path: bestPath 
    };
  }
}
