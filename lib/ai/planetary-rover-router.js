export class PlanetaryRoverRouter {
  constructor(maxTractionAngleDegrees = 20) {
    this.maxTractionAngle = maxTractionAngleDegrees;
  }

  // Helper to calculate distance between two nodes
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate slip penalty based on slope and soil cohesion
  calculateEdgeCost(nodeA, nodeB) {
    const distance = this.calculateDistance(nodeA, nodeB);
    const elevationChange = nodeB.elevation - nodeA.elevation;
    
    // Incline angle in degrees
    const inclineRadians = Math.atan2(Math.abs(elevationChange), distance);
    const inclineDegrees = inclineRadians * (180 / Math.PI);

    // If slope is steeper than the rover's traction limits, it's impassable
    if (inclineDegrees > this.maxTractionAngle) {
      return Infinity;
    }

    // Average soil cohesion between nodes (0.0 = completely loose sand, 1.0 = solid bedrock)
    const avgCohesion = (nodeA.cohesion + nodeB.cohesion) / 2;
    
    // Slip penalty increases exponentially as incline approaches max traction, and is worsened by loose soil
    // A cohesion of 1.0 reduces penalty, a cohesion of 0.1 maximizes it.
    const slipFactor = Math.pow(inclineDegrees / this.maxTractionAngle, 2);
    const cohesionPenalty = 1 + ((1 - avgCohesion) * slipFactor * 10);
    
    // Basic cost is the 3D distance multiplied by the cohesion penalty
    const trueDistance3D = Math.sqrt((distance * distance) + (elevationChange * elevationChange));
    return trueDistance3D * cohesionPenalty;
  }

  routeRover(graph, startId, endId) {
    // Simplified A* / Dijkstra stub
    // In reality, this would search the graph using the `calculateEdgeCost` heuristic.
    // For demonstration, we will just evaluate a few pre-defined paths.
    
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
      return { status: 'no_path_found', cost: Infinity, path: [] };
    }

    return { status: 'success', cost: bestCost, path: bestPath };
  }
}
