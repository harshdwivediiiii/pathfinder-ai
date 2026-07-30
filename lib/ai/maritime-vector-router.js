export class MaritimeVectorRouter {
  constructor(baseGraph) {
    this.graph = baseGraph;
    this.environmentalVectors = new Map();
  }

  ingestEnvironmentalData(gribData) {
    // Expected format: [{ edgeId: 'A-B', currentVector: {x,y}, windVector: {x,y} }, ...]
    gribData.forEach(data => {
      this.environmentalVectors.set(data.edgeId, data);
    });
  }

  calculateOverGroundSpeed(edge, basePropulsionSpeed) {
    const env = this.environmentalVectors.get(edge.id);
    let ogs = basePropulsionSpeed;

    if (env) {
      // Stub: Simplified vector math projection along the edge's direction
      // Assuming edge direction vector is normalized and environmental vectors are projected onto it.
      // For this stub, we'll just sum the magnitude of the vectors acting along the edge.
      // E.g., positive current/wind helps, negative hurts.
      const currentBoost = env.currentVector.x + env.currentVector.y; 
      const windBoost = (env.windVector.x + env.windVector.y) * 0.1; // Wind has less impact than current on a massive ship
      
      ogs = basePropulsionSpeed + currentBoost + windBoost;
      
      // Prevent negative or zero speed
      if (ogs <= 0.5) ogs = 0.5;
    }
    
    return ogs;
  }

  route(startId, endId, basePropulsionSpeed = 20) {
    if (!this.graph || !this.graph.edges) return { path: [], status: 'no_graph' };

    let bestPath = [];
    let bestTime = Infinity;

    // Simulate exploring 2 predetermined paths (stub)
    const possiblePaths = [
      { id: 'path_euclidean', edges: ['A-B', 'B-End'] },
      { id: 'path_gulfstream', edges: ['A-C', 'C-End'] }
    ];

    possiblePaths.forEach(p => {
      let time = 0;
      let valid = true;
      p.edges.forEach(edgeId => {
        const edge = this.graph.edges.find(e => e.id === edgeId);
        if (edge) {
          const ogs = this.calculateOverGroundSpeed(edge, basePropulsionSpeed);
          time += edge.distance / ogs; // Time = Distance / Speed
        } else {
          valid = false;
        }
      });
      if (valid && time < bestTime) {
        bestTime = time;
        bestPath = ['A', ...p.edges.map(e => e.split('-')[1])];
      }
    });

    return {
      path: bestPath,
      totalFuelBurnTime: bestTime,
      status: bestPath.length > 0 ? 'success' : 'no_path_found'
    };
  }
}
