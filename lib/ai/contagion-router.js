export class ContagionRouter {
  // Compute physical distance
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Evaluate the relative contagion risk multiplier of a specific node
  evaluateInfectionRisk(node, healthData) {
    const viralLoad = healthData.viralLoads?.[node.id] || 0.0; // 0.0 to 1.0
    
    // Base risk starts at 1 (neutral distance multiplier)
    let riskMultiplier = 1.0;

    // Viral load massively increases the baseline risk multiplier
    if (viralLoad > 0) {
      riskMultiplier += (viralLoad * 10);
    }

    // Node density type affects transmission probability
    if (node.type === 'ENCLOSED_TRANSIT_HUB') {
      riskMultiplier *= 3.0; // High density, poor ventilation
    } else if (node.type === 'NARROW_STREET') {
      riskMultiplier *= 1.5;
    } else if (node.type === 'OPEN_PARK') {
      riskMultiplier *= 0.2; // Excellent ventilation, natural distancing
    }

    return riskMultiplier;
  }

  // Calculate the effective routing cost for an edge
  calculateEdgeCost(nodeA, nodeB, edgeData, healthData, immunityProfile) {
    const distance = edgeData.lengthMeters || this.calculateDistance(nodeA, nodeB);
    
    // Evaluate the risk of stepping into nodeB
    const nodeRiskMultiplier = this.evaluateInfectionRisk(nodeB, healthData);

    // If there's no elevated risk, just return distance
    if (nodeRiskMultiplier <= 1.0) {
      return distance;
    }

    // Apply the user's specific immunity vulnerability profile
    let finalCost = distance;

    if (immunityProfile === 'HIGH_VULNERABILITY') {
      // Exponential penalty for risky zones, actively forces long detours through safe zones
      finalCost = distance * Math.pow(nodeRiskMultiplier, 2);
    } else if (immunityProfile === 'NORMAL') {
      // Moderate linear deterrence, will detour if convenient but won't walk miles out of the way
      finalCost = distance * nodeRiskMultiplier;
    } else if (immunityProfile === 'IMMUNE') {
      // Ignores all viral risks
      finalCost = distance;
    }

    return finalCost;
  }

  routePedestrian(graph, startId, endId, healthData = {}, immunityProfile = 'NORMAL') {
    let bestPath = [];
    let lowestCost = Infinity;

    // Simulate exploring all possible routes (graph.paths)
    graph.paths.forEach(path => {
      let currentPathCost = 0;
      
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const nodeA = path.nodes[i];
        const nodeB = path.nodes[i+1];
        
        const edgeData = path.edges ? path.edges[i] : {};

        const segmentCost = this.calculateEdgeCost(nodeA, nodeB, edgeData, healthData, immunityProfile);
        currentPathCost += segmentCost;
      }

      if (currentPathCost < lowestCost) {
        lowestCost = currentPathCost;
        bestPath = path.nodes.map(n => n.id);
      }
    });

    if (bestPath.length === 0) {
      return { status: 'no_route_found', safeCost: Infinity, path: [] };
    }

    return { status: 'success', safeCost: lowestCost, path: bestPath };
  }
}
