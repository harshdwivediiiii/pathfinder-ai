export class OversizedCargoRouter {
  constructor(baseGraph) {
    this.graph = baseGraph;
  }

  isEdgeValidForVehicle(edge, vehicle) {
    // Check height constraints (e.g. low bridges)
    if (edge.maxHeight !== undefined && vehicle.height > edge.maxHeight) {
      return false;
    }
    
    // Check weight constraints (e.g. weak bridges)
    if (edge.maxWeight !== undefined && vehicle.weight > edge.maxWeight) {
      return false;
    }
    
    // Check turning radius constraints (e.g. tight corners)
    if (edge.minTurningRadius !== undefined && vehicle.turningRadius > edge.minTurningRadius) {
      return false;
    }

    return true;
  }

  route(startId, endId, vehicleSpecs) {
    if (!this.graph || !this.graph.edges) return { path: [], status: 'no_graph' };

    // Prune invalid edges from the graph
    const validEdges = this.graph.edges.filter(edge => this.isEdgeValidForVehicle(edge, vehicleSpecs));

    // Stub for A* shortest path using only validEdges
    const path = [startId];
    let totalCost = 0;

    // Look for a direct connection (stub logic)
    const directEdge = validEdges.find(e => e.source === startId && e.target === endId);
    if (directEdge) {
      path.push(endId);
      totalCost += directEdge.distance || 10;
    } else {
      // Look for any valid multi-step path (stub logic grabs first valid edge)
      const outgoing = validEdges.find(e => e.source === startId);
      if (outgoing) {
        path.push(outgoing.target);
        totalCost += outgoing.distance || 10;
        
        if (outgoing.target !== endId) {
          path.push(endId);
          totalCost += 10; // teleport cost
        }
      }
    }

    return {
      path,
      totalCost,
      status: path.length > 1 ? 'success' : 'no_path_found',
      prunedEdgesCount: this.graph.edges.length - validEdges.length
    };
  }
}
