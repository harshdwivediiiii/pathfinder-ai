export class HyperloopRouter {
  /**
   * @param {number} cruisingSpeedMph Constant cruising speed in miles per hour.
   * @param {number} safetyBufferMs Required safety window (milliseconds) between pods at any junction.
   */
  constructor(cruisingSpeedMph = 700, safetyBufferMs = 500) {
    this.cruisingSpeedMph = cruisingSpeedMph;
    this.safetyBufferMs = safetyBufferMs;
    // Speed in miles per millisecond: (mph / 3600 seconds) / 1000 ms
    this.speedMpMs = this.cruisingSpeedMph / 3600000;
    
    // Tracks when each node/junction is occupied: 
    // nodeId => [ { timeMs, podId } ]
    this.globalSchedule = new Map(); 
  }

  // Clear schedule for testing
  clearSchedule() {
    this.globalSchedule.clear();
  }

  // Calculate physical length
  calculateDistanceMiles(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Computes exact transit time in milliseconds
  calculateTransitTimeMs(distanceMiles) {
    return Math.round(distanceMiles / this.speedMpMs);
  }

  // Checks if a pod can safely occupy a junction at a specific time
  canInterleave(nodeId, arrivalTimeMs) {
    const scheduledEvents = this.globalSchedule.get(nodeId) || [];

    for (const event of scheduledEvents) {
      // If the scheduled time is within the safety buffer of the requested time
      if (Math.abs(event.timeMs - arrivalTimeMs) < this.safetyBufferMs) {
        return false; // Conflict!
      }
    }
    return true; // Safe to pass
  }

  // Locks the route into the global schedule
  commitSchedule(routePlan) {
    for (const stop of routePlan) {
      if (!this.globalSchedule.has(stop.nodeId)) {
        this.globalSchedule.set(stop.nodeId, []);
      }
      this.globalSchedule.get(stop.nodeId).push({
        timeMs: stop.arrivalTimeMs,
        podId: stop.podId
      });
    }
  }

  // Schedules a pod, delaying its departure at the station until a clear time-slot is found
  schedulePodDeparture(graph, startId, endId, earliestDepartureMs, podId) {
    let bestPathNodes = [];
    let bestPathDistanceSegments = [];
    let lowestDistance = Infinity;

    // First, find the shortest physical path.
    // In a hyperloop, pods don't change routes to avoid traffic; they just delay departure.
    // So we just find the shortest path first.
    graph.paths.forEach(path => {
      if (path.nodes[0].id !== startId || path.nodes[path.nodes.length - 1].id !== endId) {
        return;
      }

      let distance = 0;
      let segments = [];
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const nodeA = path.nodes[i];
        const nodeB = path.nodes[i+1];
        const edgeData = path.edges ? path.edges[i] : {};
        const segDist = edgeData.lengthMiles !== undefined ? edgeData.lengthMiles : this.calculateDistanceMiles(nodeA, nodeB);
        distance += segDist;
        segments.push(segDist);
      }

      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestPathNodes = path.nodes;
        bestPathDistanceSegments = segments;
      }
    });

    if (bestPathNodes.length === 0) {
      return { status: 'no_route', departureTimeMs: -1, plan: [] };
    }

    // Now, find the exact millisecond departure time that results in zero conflicts
    let departureAttemptMs = earliestDepartureMs;
    let maxAttempts = 10000; // Prevent infinite loops
    let attempts = 0;

    while (attempts < maxAttempts) {
      let conflictDetected = false;
      let currentSimulatedTimeMs = departureAttemptMs;
      let proposedPlan = [{ nodeId: bestPathNodes[0].id, arrivalTimeMs: currentSimulatedTimeMs, podId }];

      // Check the starting node immediately
      if (!this.canInterleave(bestPathNodes[0].id, currentSimulatedTimeMs)) {
        conflictDetected = true;
      } else {
        // Simulate the journey node by node
        for (let i = 0; i < bestPathNodes.length - 1; i++) {
          const transitTimeMs = this.calculateTransitTimeMs(bestPathDistanceSegments[i]);
          currentSimulatedTimeMs += transitTimeMs;
          const nextNodeId = bestPathNodes[i+1].id;

          if (!this.canInterleave(nextNodeId, currentSimulatedTimeMs)) {
            conflictDetected = true;
            break;
          }

          proposedPlan.push({ nodeId: nextNodeId, arrivalTimeMs: currentSimulatedTimeMs, podId });
        }
      }

      if (!conflictDetected) {
        // We found a pristine time slot!
        this.commitSchedule(proposedPlan);
        return {
          status: 'scheduled',
          departureTimeMs: departureAttemptMs,
          plan: proposedPlan
        };
      }

      // Conflict found. Delay departure by 1ms and try the entire route again.
      // (Pods cannot brake mid-transit, so they must wait at the station)
      departureAttemptMs++;
      attempts++;
    }

    return { status: 'failed_to_schedule', departureTimeMs: -1, plan: [] };
  }
}
