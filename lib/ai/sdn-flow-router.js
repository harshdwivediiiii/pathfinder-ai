export class SDNFlowRouter {
  constructor(networkGraph) {
    // Expected edge format: { id: 'A-B', capacity: 100, currentLoad: 0, baseLatency: 10 }
    this.networkGraph = networkGraph; 
  }

  calculateDynamicLinkCost(edge, dataBurstSize) {
    const projectedLoad = edge.currentLoad + dataBurstSize;

    if (projectedLoad > edge.capacity) {
      return Infinity; // Link cannot physically handle this burst (packet loss)
    }

    // Calculate saturation percentage
    const saturation = projectedLoad / edge.capacity;

    // Exponential penalty curve: Cost skyrockets as saturation approaches 100%
    // e.g. latency + (latency * saturation^4 * penaltyMultiplier)
    const penaltyMultiplier = 50; 
    const saturationPenalty = Math.pow(saturation, 4) * penaltyMultiplier;

    return edge.baseLatency + saturationPenalty;
  }

  routeDataBurst(sourceNode, targetNode, dataBurstSize) {
    if (!this.networkGraph || !this.networkGraph.edges) return { path: [], status: 'no_graph' };

    let bestPath = [];
    let bestCost = Infinity;

    // Simulate exploring predefined paths (stub)
    const possiblePaths = [
      { id: 'path_primary', edges: ['Core-1', 'Core-2'] },
      { id: 'path_secondary', edges: ['Edge-1', 'Edge-2', 'Edge-3'] } 
    ];

    possiblePaths.forEach(p => {
      let pathCost = 0;
      let valid = true;

      p.edges.forEach(edgeId => {
        if (!valid) return;

        const edge = this.networkGraph.edges.find(e => e.id === edgeId);
        if (edge) {
          const linkCost = this.calculateDynamicLinkCost(edge, dataBurstSize);
          if (linkCost === Infinity) {
             valid = false;
          } else {
             pathCost += linkCost;
          }
        } else {
          valid = false;
        }
      });
      
      if (valid && pathCost < bestCost) {
        bestCost = pathCost;
        bestPath = p.edges; // For simplicity, just return edge IDs
      }
    });

    if (bestPath.length > 0) {
      // Apply the load to the network to affect subsequent routing (Stateful)
      bestPath.forEach(edgeId => {
        const edge = this.networkGraph.edges.find(e => e.id === edgeId);
        if (edge) {
          edge.currentLoad += dataBurstSize;
        }
      });
      
      return {
        path: bestPath,
        cost: bestCost,
        status: 'success'
      };
    }

    return { path: [], status: 'network_congested_packet_dropped' };
  }
}
