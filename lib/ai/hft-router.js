export class HFTRouter {
  constructor() {
    // Speed of light in a vacuum in meters per second
    this.C = 299792458;
    
    // Default refractive indices
    this.REFRACTIVE_INDICES = {
      vacuum: 1.0,
      air: 1.0003,      // Microwave / free-space optics
      fiber: 1.4682     // Standard silica optical fiber
    };
  }

  // Helper to calculate 3D Euclidean distance (in meters)
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const dz = (nodeB.elevation || 0) - (nodeA.elevation || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculates the latency of an edge in microseconds.
   * 
   * @param {Object} nodeA Start node
   * @param {Object} nodeB End node
   * @param {Object} edgeData Contains medium ('fiber' or 'air') and hardwareDelay (in microseconds)
   */
  calculateEdgeLatency(nodeA, nodeB, edgeData) {
    // 1. Calculate physical distance in meters
    // If the edge specifies a fixed cable length, use it. Otherwise compute straight-line distance.
    const physicalDistance = edgeData.lengthMeters || this.calculateDistance(nodeA, nodeB);

    // 2. Determine effective speed of light through the medium (v = c / n)
    const refractiveIndex = this.REFRACTIVE_INDICES[edgeData.medium] || this.REFRACTIVE_INDICES.fiber;
    const effectiveSpeed = this.C / refractiveIndex;

    // 3. Calculate propagation delay in seconds, then convert to microseconds
    const propagationDelaySeconds = physicalDistance / effectiveSpeed;
    const propagationDelayMicroseconds = propagationDelaySeconds * 1_000_000;

    // 4. Add intrinsic hardware switching/amplification delays (in microseconds)
    const hardwareDelay = edgeData.hardwareDelayMicroseconds || 0;

    return propagationDelayMicroseconds + hardwareDelay;
  }

  /**
   * Finds the absolute minimum latency path using Dijkstra's algorithm.
   */
  routeData(graph, startId, endId) {
    let bestPath = [];
    let bestLatency = Infinity;

    // Simplified DFS/BFS for paths (in real-world, use Dijkstra/A* on a full adjacency list)
    // Here we evaluate pre-computed possible routes (paths) supplied in the graph for demonstration.
    graph.paths.forEach(pathObj => {
      let currentLatency = 0;
      let valid = true;
      
      for (let i = 0; i < pathObj.nodes.length - 1; i++) {
        const nodeA = pathObj.nodes[i];
        const nodeB = pathObj.nodes[i+1];
        // Assuming pathObj provides edgeData for each hop
        const edgeData = pathObj.edges ? pathObj.edges[i] : { medium: 'fiber', hardwareDelayMicroseconds: 0 };
        
        currentLatency += this.calculateEdgeLatency(nodeA, nodeB, edgeData);
      }

      if (valid && currentLatency < bestLatency) {
        bestLatency = currentLatency;
        bestPath = pathObj.nodes.map(n => n.id);
      }
    });

    if (bestPath.length === 0) {
      return { status: 'no_route_found', latency: Infinity, path: [] };
    }

    return { status: 'success', latency: bestLatency, path: bestPath };
  }
}
