export class SpaceElevatorRouter {
  /**
   * @param {number} climberSpeedKmH Constant speed of the climbers in km/h.
   */
  constructor(climberSpeedKmH = 200) {
    this.climberSpeedKmH = climberSpeedKmH;
    
    // Global schedule to track passing loop occupation and tether segment usage.
    // We will store scheduled trajectories. 
    this.scheduledTrajectories = []; // Array of { podId, route: [{ nodeId, arrivalTimeHr, departureTimeHr }] }
  }

  clearSchedule() {
    this.scheduledTrajectories = [];
  }

  // Calculate physical length
  calculateDistanceKm(nodeA, nodeB) {
    // 1D tether. Use Y coordinate as altitude in km.
    return Math.abs(nodeB.y - nodeA.y);
  }

  // Calculate transit time in hours
  calculateTransitTimeHr(distanceKm) {
    return distanceKm / this.climberSpeedKmH;
  }

  // Checks if a proposed trajectory conflicts with any existing schedules
  detectCollision(proposedTrajectory) {
    for (const scheduled of this.scheduledTrajectories) {
      // Check each segment of the proposed trajectory against each segment of the scheduled trajectory
      for (let i = 0; i < proposedTrajectory.length - 1; i++) {
        const propStart = proposedTrajectory[i];
        const propEnd = proposedTrajectory[i+1];

        for (let j = 0; j < scheduled.route.length - 1; j++) {
          const schedStart = scheduled.route[j];
          const schedEnd = scheduled.route[j+1];

          // Are they on the exact same physical tether segment?
          const sameSegment = 
            (propStart.nodeId === schedStart.nodeId && propEnd.nodeId === schedEnd.nodeId) || 
            (propStart.nodeId === schedEnd.nodeId && propEnd.nodeId === schedStart.nodeId);

          if (sameSegment) {
            // Check for temporal overlap on this segment
            const propEnter = propStart.departureTimeHr;
            const propExit = propEnd.arrivalTimeHr;
            
            const schedEnter = schedStart.departureTimeHr;
            const schedExit = schedEnd.arrivalTimeHr;

            // If the time intervals [propEnter, propExit] and [schedEnter, schedExit] overlap
            // and they are moving in OPPOSITE directions, they crash mid-tether.
            // If they are moving in the SAME direction at the SAME speed, they don't crash unless they depart at the same time.
            const overlap = (propEnter < schedExit) && (schedEnter < propExit);
            
            if (overlap) {
              // Same direction check
              if (propStart.nodeId === schedStart.nodeId) {
                // Same direction. Since speed is constant, they only crash if they depart within a tiny safety margin.
                // For simplicity, we just enforce they cannot be on the same segment at the same time at all unless perfectly synced, 
                // but usually we want a safety gap. Let's say if they overlap at all in the same direction, it's a conflict for now,
                // or we require strict separation. Let's just say any overlap on the segment is a collision.
                return true; 
              } else {
                // Opposite directions. A head-on collision is guaranteed.
                return true;
              }
            }
          }
        }
      }

      // Check node collisions. They can only be at the same node at the same time if isPassingLoop is true.
      for (const propNode of proposedTrajectory) {
        for (const schedNode of scheduled.route) {
          if (propNode.nodeId === schedNode.nodeId) {
            const propArrival = propNode.arrivalTimeHr;
            const propDep = propNode.departureTimeHr;
            const schedArrival = schedNode.arrivalTimeHr;
            const schedDep = schedNode.departureTimeHr;

            const overlap = (propArrival < schedDep) && (schedArrival < propDep);
            if (overlap && !propNode.isPassingLoop) {
              return true; // Crash at a non-passing node!
            }
          }
        }
      }
    }

    return false; // No collision
  }

  // Generates a proposed trajectory based on a departure time
  generateTrajectory(pathNodes, earliestDepartureHr) {
    let trajectory = [];
    let currentTime = earliestDepartureHr;

    for (let i = 0; i < pathNodes.length; i++) {
      const node = pathNodes[i];
      const arrival = currentTime;
      
      // Climbers don't stop unless they have to, but they can wait at passing loops if scheduled to.
      // For this algorithm, we'll try continuous ascent/descent first. If it fails, we delay departure.
      // We don't implement complex mid-tether waiting yet, just departure delay.
      const departure = currentTime; 

      trajectory.push({
        nodeId: node.id,
        isPassingLoop: node.isPassingLoop || false,
        arrivalTimeHr: arrival,
        departureTimeHr: departure
      });

      if (i < pathNodes.length - 1) {
        const nextNode = pathNodes[i+1];
        const distance = this.calculateDistanceKm(node, nextNode);
        const transitTime = this.calculateTransitTimeHr(distance);
        currentTime += transitTime;
      }
    }

    return trajectory;
  }

  // Schedules a climber, delaying departure until the path is clear
  scheduleClimber(graph, startId, endId, earliestDepartureHr, climberId) {
    // 1D graph, so there's really only one path. We'll just grab it.
    let pathNodes = [];
    graph.paths.forEach(p => {
      if (p.nodes[0].id === startId && p.nodes[p.nodes.length-1].id === endId) {
        pathNodes = p.nodes;
      }
    });

    if (pathNodes.length === 0) return { status: 'no_route' };

    let departureAttemptHr = earliestDepartureHr;
    const maxAttempts = 1000;
    const delayStepHr = 0.1; // Delay by 6 minutes per attempt

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const proposedTrajectory = this.generateTrajectory(pathNodes, departureAttemptHr);
      
      if (!this.detectCollision(proposedTrajectory)) {
        // Safe! Commit to schedule
        this.scheduledTrajectories.push({
          climberId,
          route: proposedTrajectory
        });

        return {
          status: 'scheduled',
          departureTimeHr: departureAttemptHr,
          trajectory: proposedTrajectory
        };
      }

      departureAttemptHr += delayStepHr;
    }

    return { status: 'failed_to_schedule' };
  }
}
