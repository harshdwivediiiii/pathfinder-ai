export class AvalancheRiskRouter {
  // Helper to calculate distance between two nodes (x, y coordinates in meters)
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate routing cost based on terrain and weather conditions
  calculateEdgeCost(nodeA, nodeB, weatherConditions = { avalancheRiskLevel: 'LOW' }) {
    const riskLevel = weatherConditions.avalancheRiskLevel?.toUpperCase() || 'LOW';
    
    // Check for explicit hazard zones during high-risk weather
    if (riskLevel === 'HIGH' || riskLevel === 'EXTREME') {
      if (nodeA.isCornice || nodeB.isCornice) return Infinity;
      if (nodeA.isRunoutZone || nodeB.isRunoutZone) return Infinity;
    }

    const distance = this.calculateDistance(nodeA, nodeB);
    const elevationChange = Math.abs(nodeB.elevation - nodeA.elevation);
    
    // Incline angle in degrees
    const inclineRadians = Math.atan2(elevationChange, distance);
    const inclineDegrees = inclineRadians * (180 / Math.PI);

    // True 3D distance
    const trueDistance3D = Math.sqrt((distance * distance) + (elevationChange * elevationChange));
    
    // Calculate avalanche risk penalty based on incline
    // Slopes between 30 and 45 degrees are prime avalanche trigger zones
    let avalanchePenalty = 1.0;
    
    if (inclineDegrees >= 30 && inclineDegrees <= 45) {
      if (riskLevel === 'EXTREME') {
        return Infinity; // Impassable in extreme conditions
      } else if (riskLevel === 'HIGH') {
        avalanchePenalty = 100.0;
      } else if (riskLevel === 'MODERATE') {
        avalanchePenalty = 10.0;
      } else {
        avalanchePenalty = 2.0;
      }
    } else if (inclineDegrees > 45) {
      // Slopes > 45 degrees usually shed snow naturally and are less prone to slab avalanches,
      // but they are still extremely steep and risky for routing.
      avalanchePenalty = 3.0; 
    }

    return trueDistance3D * avalanchePenalty;
  }

  routeSkier(graph, startId, endId, weatherConditions = { avalancheRiskLevel: 'LOW' }) {
    let bestPath = [];
    let bestCost = Infinity;

    graph.paths.forEach(path => {
      let currentCost = 0;
      let valid = true;
      
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const cost = this.calculateEdgeCost(path.nodes[i], path.nodes[i+1], weatherConditions);
        if (cost === Infinity) {
          valid = false;
          break;
        }
        currentCost += cost;
      }

      if (valid && currentCost < bestCost) {
        bestCost = currentCost;
        bestPath = path.nodes.map(n => n.id);
      }
    });

    if (bestPath.length === 0) {
      return { status: 'no_safe_path_found', cost: Infinity, path: [] };
    }

    return { status: 'success', cost: bestCost, path: bestPath };
  }
}
