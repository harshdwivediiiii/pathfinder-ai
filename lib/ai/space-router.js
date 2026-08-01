export class SpaceRouter {
  // Simulates a hyperbolic flyby around a planetary body to calculate Gravity Assist delta-v boost
  calculateGravityAssist(planetNode, vIn) {
    if (!planetNode.mass) return 0;
    
    // Extremely simplified patched conic approximation
    // The larger the planet mass and the higher the inbound velocity, the larger the potential boost
    // (In real life, this depends on flyby altitude, deflection angle, and the planet's heliocentric velocity)
    const massFactor = planetNode.mass / 1e24; // Earth masses approx
    
    // Simplistic formula for the sake of the algorithm:
    // Boost is proportional to the planet's mass and the spacecraft's inbound velocity
    let dvAssist = (massFactor * 1.5) + (vIn * 0.1); 
    
    // Cap the assist to avoid infinite acceleration exploits
    const maxAssist = planetNode.maxAssistVelocity || 15; // km/s
    
    return Math.min(dvAssist, maxAssist);
  }

  // Base calculation of required Delta-V to transfer between two orbital nodes
  calculateBaseDeltaV(nodeA, nodeB) {
    // Simplified transfer cost (difference in orbital energy proxy)
    const orbitDistanceDiff = Math.abs(nodeB.orbitRadius - nodeA.orbitRadius);
    
    // Hohmann-ish transfer estimation: km/s required per AU distance
    const dvRequired = orbitDistanceDiff * 2.5; 
    
    return dvRequired;
  }

  routeSpacecraft(graph, startId, targetId, missionWindow = { maxFlightTimeYears: 10 }) {
    let bestPath = [];
    let bestDeltaV = Infinity;
    let bestTime = Infinity;

    graph.paths.forEach(path => {
      let currentDeltaV = 0;
      let totalTimeYears = 0;
      let valid = true;
      let currentVelocity = 0; // Relative to the sun or local frame
      
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const nodeA = path.nodes[i];
        const nodeB = path.nodes[i+1];
        
        // Time taken for this leg (provided by edge data in the graph)
        const edge = path.edges[i];
        totalTimeYears += edge.transferTimeYears;

        if (totalTimeYears > missionWindow.maxFlightTimeYears) {
          valid = false;
          break;
        }

        // Calculate base delta-V needed to reach nodeB
        const baseDv = this.calculateBaseDeltaV(nodeA, nodeB);
        currentDeltaV += baseDv;
        currentVelocity += baseDv;

        // Is nodeB a flyby or the final destination?
        const isFlyby = (i + 1 < path.nodes.length - 1);
        
        if (isFlyby) {
          // Perform a gravity assist
          const dvAssist = this.calculateGravityAssist(nodeB, currentVelocity);
          
          // The assist essentially gives us "free" delta-v for the NEXT leg, 
          // effectively reducing the total mission delta-V cost we have to pay out of pocket.
          // We apply the discount to the *total* running cost, assuming we burn less fuel later.
          // For simplicity in this graph algorithm, we literally subtract it from the cost.
          currentDeltaV -= dvAssist;
          
          // Spacecraft speeds up
          currentVelocity += dvAssist;
        }
      }

      // We only care about absolute minimum Delta-V
      if (valid && currentDeltaV < bestDeltaV) {
        bestDeltaV = currentDeltaV;
        bestTime = totalTimeYears;
        bestPath = path.nodes.map(n => n.id);
      }
    });

    if (bestPath.length === 0) {
      return { status: 'no_route_found', deltaV: Infinity, time: Infinity, path: [] };
    }

    // DeltaV cannot be negative, physics says no (you still have to launch)
    bestDeltaV = Math.max(bestDeltaV, 0);

    return { status: 'success', deltaV: bestDeltaV, flightTimeYears: bestTime, path: bestPath };
  }
}
