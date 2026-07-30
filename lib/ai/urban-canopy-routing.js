export class UrbanCanopyRouter {
  constructor(baseGraph) {
    this.graph = baseGraph;
  }

  calculateSolarAngle(hourOfDay) {
    // Stub calculation for solar angle based on a 24-hour clock.
    // Assuming 12 PM is directly overhead (90 degrees).
    // 6 AM is 0 degrees (sunrise), 6 PM is 180 degrees (sunset).
    if (hourOfDay < 6 || hourOfDay > 18) {
      return -1; // Nighttime
    }
    const hoursFromSunrise = hourOfDay - 6;
    return (hoursFromSunrise / 12.0) * 180.0;
  }

  isEdgeShaded(edge, solarAngleDegrees, buildings) {
    if (solarAngleDegrees === -1) return true; // Night is always shaded
    
    // Stub raycasting: if a building is tall enough next to the edge, it casts shade.
    const adjacentBuildings = buildings.filter(b => edge.adjacentBuildingIds.includes(b.id));
    
    // Simulate shade: if it's afternoon (angle > 90), buildings on the West cast shade
    // if morning (angle < 90), buildings on the East cast shade
    for (const building of adjacentBuildings) {
      if (solarAngleDegrees < 90 && building.location === 'East' && building.height > 10) return true;
      if (solarAngleDegrees > 90 && building.location === 'West' && building.height > 10) return true;
      if (solarAngleDegrees === 90 && building.height > 50) return true; // Very tall buildings might shade even at noon
    }
    
    return false;
  }

  route(startId, endId, hourOfDay, buildingsData) {
    if (!this.graph || !this.graph.edges) return { path: [], status: 'no_graph' };

    const solarAngle = this.calculateSolarAngle(hourOfDay);
    let totalCost = 0;
    const path = [startId];

    // Evaluate edges from startId
    // For stub purposes, just pick the edge with the lowest shade-penalized weight
    const outgoingEdges = this.graph.edges.filter(e => e.source === startId);
    
    outgoingEdges.forEach(edge => {
      const shaded = this.isEdgeShaded(edge, solarAngle, buildingsData);
      // Heavy penalty for direct UV exposure
      edge.currentCost = shaded ? edge.baseWeight : edge.baseWeight * 5.0; 
    });

    // Find best edge
    outgoingEdges.sort((a, b) => a.currentCost - b.currentCost);
    const bestEdge = outgoingEdges[0];

    if (bestEdge) {
      path.push(bestEdge.target);
      totalCost += bestEdge.currentCost;
      if (bestEdge.target !== endId) {
        path.push(endId); // Teleport to end
        totalCost += 10;
      }
    }

    return {
      path,
      totalCost,
      status: path.length > 1 ? 'success' : 'no_path_found',
      solarAngle
    };
  }
}
