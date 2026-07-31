export class AvalancheRiskRouter {
  constructor(currentDangerLevel = 1) {
    // Danger levels: 1 (Low) to 5 (Extreme)
    this.dangerLevel = currentDangerLevel;
  }

  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateEdgeCost(nodeA, nodeB) {
    const distance = this.calculateDistance(nodeA, nodeB);
    const elevationChange = Math.abs(nodeB.elevation - nodeA.elevation);
    const trueDistance3D = Math.sqrt((distance * distance) + (elevationChange * elevationChange));
    
    // Incline angle in degrees
    const inclineRadians = Math.atan2(elevationChange, distance);
    const inclineDegrees = inclineRadians * (180 / Math.PI);

    let riskPenalty = 1.0;

    // Evaluate dynamic avalanche risk based on current danger level
    if (this.dangerLevel >= 3) {
      // Slopes between 30 and 45 degrees are prime avalanche trigger zones (the "sweet spot" for slab avalanches)
      if (inclineDegrees >= 30 && inclineDegrees <= 45) {
        // Exponential penalty based on danger level
        riskPenalty = Math.pow(10, this.dangerLevel);
      }

      // If passing under a cornice or through a known runout zone during high danger, route is impassable
      if (nodeB.isUnderCornice || nodeB.isRunoutZone) {
        return Infinity;
      }
    }

    // Cost is base 3D distance multiplied by the risk penalty
    return trueDistance3D * riskPenalty;
  }

  routeSkier(graph, startId, endId) {
    let bestPath = [];
    let bestCost = Infinity;

    graph.paths.forEach(path => {
      let currentCost = 0;
      let valid = true;
      
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const cost = this.calculateEdgeCost(path.nodes[i], path.nodes[i+1]);
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
