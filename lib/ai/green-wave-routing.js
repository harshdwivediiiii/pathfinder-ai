export class GreenWaveRouter {
  constructor(baseGraph) {
    this.graph = baseGraph;
    this.trafficLights = new Map(); // IntersectionId -> Schedule
  }

  ingestTrafficLightSchedules(schedules) {
    // Schedule format: { intersectionId: 'A', cycleLength: 60, greenStart: 0, greenEnd: 30 }
    schedules.forEach(schedule => {
      this.trafficLights.set(schedule.intersectionId, schedule);
    });
  }

  calculateOptimalSpeed(distance, currentTime, intersectionId) {
    const light = this.trafficLights.get(intersectionId);
    if (!light) return null; // No V2I data for this intersection

    const minTravelTime = distance / 25.0; // Assume max speed 25 m/s (55 mph)
    const earliestArrival = currentTime + minTravelTime;
    
    let timeToGreen = 0;
    
    // Find the next green window we can actually hit
    const earliestCycleTime = earliestArrival % light.cycleLength;
    let cyclesToWait = Math.floor(earliestArrival / light.cycleLength) - Math.floor(currentTime / light.cycleLength);
    
    if (earliestCycleTime >= light.greenStart && earliestCycleTime <= light.greenEnd - 5) {
      // We can make it during the green window of the cycle we arrive in
      timeToGreen = earliestArrival - currentTime;
    } else {
      // We will hit a red light, so target the start of the NEXT green window
      const waitInCycle = (light.cycleLength - earliestCycleTime) + light.greenStart;
      let extraWait = waitInCycle;
      if (earliestCycleTime < light.greenStart) {
        extraWait = light.greenStart - earliestCycleTime;
      }
      timeToGreen = (earliestArrival - currentTime) + extraWait;
    }

    const requiredArrivalTime = currentTime + timeToGreen;
    const travelTime = requiredArrivalTime - currentTime;

    // v = d / t
    const requiredSpeedMps = distance / travelTime;
    const requiredSpeedMph = requiredSpeedMps * 2.23694;

    return {
      speedMph: requiredSpeedMph,
      arrivalTime: requiredArrivalTime
    };
  }

  route(startId, endId, startTime) {
    if (!this.graph || !this.graph.edges) return { path: [], status: 'no_graph' };

    let currentTime = startTime;
    const path = [startId];
    const speedRecommendations = [];

    // Find edges
    const outgoingEdges = this.graph.edges.filter(e => e.source === startId);
    
    // For stub purposes, just pick the first edge
    const edge = outgoingEdges[0];
    
    if (edge) {
      const optimization = this.calculateOptimalSpeed(edge.distance, currentTime, edge.target);
      
      path.push(edge.target);
      
      if (optimization) {
        currentTime = optimization.arrivalTime;
        speedRecommendations.push({
          edge: `${edge.source}->${edge.target}`,
          recommendedSpeedMph: optimization.speedMph
        });
      } else {
        // Default travel time if no smart light
        currentTime += edge.distance / 10.0; // 10 m/s default
      }
      
      if (edge.target !== endId) {
        path.push(endId); // Teleport to end
      }
    }

    return {
      path,
      totalTime: currentTime - startTime,
      speedRecommendations,
      status: path.length > 1 ? 'success' : 'no_path_found'
    };
  }
}
