export class WildlifeRouter {
  // Compute physical distance
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate the ecological cost of a specific edge
  calculateEcologicalCost(edgeData, distance) {
    let cost = distance;

    const landUse = edgeData.landUse || 'NATURAL';
    const naturalCover = edgeData.naturalCover || 'MODERATE';
    const trafficVolume = edgeData.trafficVolume || 0;

    // Land Use Penalties
    if (landUse === 'URBAN') {
      cost *= 10; // Massive penalty for urban sprawl
    } else if (landUse === 'AGRICULTURE') {
      cost *= 3; // Moderate penalty (pesticides, lack of cover)
    }

    // Natural Cover Rewards/Penalties
    if (naturalCover === 'FOREST') {
      cost *= 0.5; // Dense cover is extremely safe for wildlife
    } else if (naturalCover === 'BARREN') {
      cost *= 2.0; // Exposed terrain is risky
    }

    // Highway / Traffic Penalties (Cost scales exponentially with traffic)
    // Identifies lethal crossings. 1000+ cars/day is essentially a wall.
    if (trafficVolume > 0) {
      // Base traffic penalty + exponential scale
      cost += trafficVolume * 2;
    }

    return cost;
  }

  // Discovers the optimal ecological path connecting the two habitats
  routeMigrationCorridor(graph, startHabitatId, endHabitatId) {
    let bestPath = [];
    let lowestCost = Infinity;
    let bridgeInterventions = [];

    // Simulate exploring all possible routes
    graph.paths.forEach(path => {
      let currentPathCost = 0;
      let pathInterventions = [];
      
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const nodeA = path.nodes[i];
        const nodeB = path.nodes[i+1];
        
        const edgeData = path.edges ? path.edges[i] : {};
        const distance = edgeData.lengthMeters !== undefined ? edgeData.lengthMeters : this.calculateDistance(nodeA, nodeB);

        const segmentCost = this.calculateEcologicalCost(edgeData, distance);
        currentPathCost += segmentCost;

        // If the path crosses a high-traffic highway, flag it as a required bridge intervention
        // Let's define high traffic as > 500 vehicles
        if (edgeData.trafficVolume > 500) {
          pathInterventions.push({
            location: `Between ${nodeA.id} and ${nodeB.id}`,
            trafficVolume: edgeData.trafficVolume,
            reason: 'Lethal highway crossing requires a wildlife bridge/tunnel.'
          });
        }
      }

      if (currentPathCost < lowestCost) {
        lowestCost = currentPathCost;
        bestPath = path.nodes.map(n => n.id);
        bridgeInterventions = pathInterventions;
      }
    });

    if (bestPath.length === 0) {
      return { status: 'no_route_found', cost: Infinity, path: [], interventions: [] };
    }

    return { 
      status: 'success', 
      cost: lowestCost, 
      path: bestPath,
      interventions: bridgeInterventions
    };
  }
}
