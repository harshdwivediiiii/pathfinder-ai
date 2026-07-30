export class DrivingProfiler {
  constructor(userId) {
    this.userId = userId;
    this.profileMatrix = {
      highwayAggressiveness: 1.0,
      intersectionCaution: 1.0,
      corneringSpeed: 1.0
    };
  }

  analyzeHistoricalTrips(trips) {
    // Compare expected ETA to actual arrival time
    let highwayOffsetTotal = 0;
    
    trips.forEach(trip => {
      // If user consistently arrives 10% earlier on highways
      if (trip.routeType === 'highway') {
        highwayOffsetTotal += (trip.actualTime / trip.expectedTime);
      }
    });

    if (trips.length > 0) {
      this.profileMatrix.highwayAggressiveness = highwayOffsetTotal / trips.length;
    }
  }

  applyPersonalizedWeights(baseGraph) {
    const personalizedGraph = { nodes: baseGraph.nodes, edges: [] };

    for (let edge of baseGraph.edges) {
      let speedMultiplier = 1.0;
      
      if (edge.type === 'highway') {
        // e.g. aggressive drivers (0.9 multiplier means faster traversal)
        speedMultiplier = this.profileMatrix.highwayAggressiveness;
      } else if (edge.type === 'intersection') {
        speedMultiplier = this.profileMatrix.intersectionCaution;
      }

      personalizedGraph.edges.push({
        ...edge,
        personalizedWeight: edge.weight * speedMultiplier,
        expectedSpeed: edge.speed / Math.max(speedMultiplier, 0.1)
      });
    }

    return personalizedGraph;
  }
}
