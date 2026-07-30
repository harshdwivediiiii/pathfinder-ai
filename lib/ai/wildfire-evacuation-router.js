export class WildfireEvacuationRouter {
  constructor(baseGraph) {
    this.graph = baseGraph;
    this.fireData = [];
  }

  ingestFireData(activeFires) {
    // Format: { originId: 'N1', spreadRateMps: 2.0, timeOfReport: 0 }
    this.fireData = activeFires;
  }

  getFireEngulfmentTime(edgeId, currentTime) {
    // Stub predictive model based on distance from fire origin
    // In a real scenario, this uses cellular automata or Rothermel's equations.
    const edge = this.graph.edges.find(e => e.id === edgeId);
    if (!edge) return Infinity;

    let earliestEngulfment = Infinity;

    this.fireData.forEach(fire => {
      // Very basic stub: if the edge has a recorded 'distanceToFireOrigin'
      if (edge.distanceToFireOrigin !== undefined) {
        const timeToEngulf = fire.timeOfReport + (edge.distanceToFireOrigin / fire.spreadRateMps);
        if (timeToEngulf < earliestEngulfment) {
          earliestEngulfment = timeToEngulf;
        }
      }
    });

    return earliestEngulfment;
  }

  route(startId, endId, startTime = 0) {
    if (!this.graph || !this.graph.edges) return { path: [], status: 'no_graph' };

    // Stub for time-expanded A* shortest path
    let bestPath = [];
    let bestTime = Infinity;

    // Simulate exploring 2 predetermined paths (stub)
    const possiblePaths = [
      { id: 'path_direct', edges: ['A-B', 'B-End'] },
      { id: 'path_detour', edges: ['A-C', 'C-End'] }
    ];

    possiblePaths.forEach(p => {
      let currentTime = startTime;
      let valid = true;
      
      p.edges.forEach(edgeId => {
        if (!valid) return;

        const edge = this.graph.edges.find(e => e.id === edgeId);
        if (edge) {
          // Assume vehicle travels at 15 m/s
          const travelTime = edge.distance / 15.0;
          const arrivalTime = currentTime + travelTime;
          
          // Check if fire engulfs the edge before or exactly when we are on it
          const engulfmentTime = this.getFireEngulfmentTime(edgeId, currentTime);
          
          // Add a safety buffer of 10 minutes (600 seconds)
          if (arrivalTime > engulfmentTime - 600) {
            valid = false; // Path is deadly
          } else {
            currentTime = arrivalTime;
          }
        } else {
          valid = false;
        }
      });
      
      if (valid && currentTime < bestTime) {
        bestTime = currentTime;
        bestPath = ['A', ...p.edges.map(e => e.split('-')[1])];
      }
    });

    return {
      path: bestPath,
      totalTime: bestTime - startTime,
      status: bestPath.length > 0 ? 'success' : 'no_safe_path'
    };
  }
}
