export class WaterBomberRouter {
  // Compute physical flight distance
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Evaluates safety of a flight path against real-time smoke plumes
  evaluateFlightSafety(edgeData, distance, smokeData) {
    let cost = distance;

    const smokeDensity = smokeData[edgeData.id] || 0; // 0.0 to 1.0

    if (smokeDensity > 0) {
      if (smokeDensity >= 0.8) {
        cost = Infinity; // Engine choking/zero visibility hazard
      } else {
        // Exponential cost for flying through moderate smoke
        cost += distance * Math.pow(smokeDensity * 10, 2);
      }
    }

    return cost;
  }

  // Calculates the optimal path between two specific points
  findPath(graph, startId, endId, smokeData) {
    let bestPath = [];
    let lowestCost = Infinity;

    graph.paths.forEach(path => {
      // Must connect start to end
      if (path.nodes[0].id !== startId || path.nodes[path.nodes.length - 1].id !== endId) {
        return;
      }

      let currentPathCost = 0;
      let valid = true;

      for (let i = 0; i < path.nodes.length - 1; i++) {
        const nodeA = path.nodes[i];
        const nodeB = path.nodes[i+1];
        const edgeData = path.edges ? path.edges[i] : { id: `${nodeA.id}-${nodeB.id}` };
        
        const distance = edgeData.lengthMeters !== undefined ? edgeData.lengthMeters : this.calculateDistance(nodeA, nodeB);
        const segmentCost = this.evaluateFlightSafety(edgeData, distance, smokeData);

        if (segmentCost === Infinity) {
          valid = false;
          break;
        }

        currentPathCost += segmentCost;
      }

      if (valid && currentPathCost < lowestCost) {
        lowestCost = currentPathCost;
        bestPath = path.nodes.map(n => n.id);
      }
    });

    return { path: bestPath, cost: lowestCost };
  }

  // Generate a complete cyclic route: Aircraft -> Water -> Fire
  generateCyclicRoute(graph, aircraftPositionId, fireFrontId, waterSourceIds, smokeData) {
    let optimalCycle = null;
    let minTotalTurnaroundCost = Infinity;
    let selectedWaterSource = null;

    for (const waterSourceId of waterSourceIds) {
      // Phase 1: Aircraft to Water
      const phase1 = this.findPath(graph, aircraftPositionId, waterSourceId, smokeData);
      
      // Phase 2: Water to Fire
      const phase2 = this.findPath(graph, waterSourceId, fireFrontId, smokeData);

      if (phase1.cost !== Infinity && phase2.cost !== Infinity) {
        const totalCycleCost = phase1.cost + phase2.cost;
        if (totalCycleCost < minTotalTurnaroundCost) {
          minTotalTurnaroundCost = totalCycleCost;
          selectedWaterSource = waterSourceId;
          
          // Construct figure-eight path, merging at the water source
          const fullPath = [...phase1.path];
          // Remove duplicate water source node before appending phase 2
          fullPath.pop(); 
          fullPath.push(...phase2.path);

          optimalCycle = {
            totalCost: totalCycleCost,
            waterSource: waterSourceId,
            route: fullPath
          };
        }
      }
    }

    if (!optimalCycle) {
      return { status: 'no_safe_route', totalCost: Infinity, waterSource: null, route: [] };
    }

    return { status: 'success', ...optimalCycle };
  }
}
