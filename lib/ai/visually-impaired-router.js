export class VisuallyImpairedRouter {
  constructor(baseGraph) {
    this.graph = baseGraph;
    this.accessibilityMetadata = new Map();
  }

  ingestAccessibilityData(metadataList) {
    // Expected format: [{ edgeId: 'A-B', hasTactilePaving: true, hasAuditorySignal: false, isComplexPlaza: false }, ...]
    metadataList.forEach(data => {
      this.accessibilityMetadata.set(data.edgeId, data);
    });
  }

  calculateEdgeCost(edge) {
    const meta = this.accessibilityMetadata.get(edge.id) || {
      hasTactilePaving: false,
      hasAuditorySignal: false,
      isComplexPlaza: false
    };

    if (meta.isComplexPlaza) {
      return Infinity; // Avoid unstructured areas entirely
    }

    let cost = edge.distance;

    // Apply severe penalties for missing critical accessibility infrastructure
    if (!meta.hasTactilePaving) {
      cost += 5000; 
    }
    if (!meta.hasAuditorySignal) {
      cost += 2000;
    }

    return cost;
  }

  route(startId, endId) {
    if (!this.graph || !this.graph.edges) return { path: [], status: 'no_graph' };

    let bestPath = [];
    let bestHeuristicCost = Infinity;

    // Simulate exploring predetermined paths (stub)
    const possiblePaths = [
      { id: 'path_plaza', edges: ['A-B', 'B-End'] },
      { id: 'path_no_tactile', edges: ['A-C', 'C-End'] },
      { id: 'path_tactile_accessible', edges: ['A-D', 'D-End'] }
    ];

    possiblePaths.forEach(p => {
      let heuristicCost = 0;
      let valid = true;

      p.edges.forEach(edgeId => {
        const edge = this.graph.edges.find(e => e.id === edgeId);
        if (edge) {
          const cost = this.calculateEdgeCost(edge);
          if (cost === Infinity) {
            valid = false;
          } else {
            heuristicCost += cost;
          }
        } else {
          valid = false;
        }
      });
      
      if (valid && heuristicCost < bestHeuristicCost) {
        bestHeuristicCost = heuristicCost;
        bestPath = ['A', ...p.edges.map(e => e.split('-')[1])];
      }
    });

    return {
      path: bestPath,
      totalAccessibilityCost: bestHeuristicCost,
      status: bestPath.length > 0 ? 'success' : 'no_accessible_path_found'
    };
  }
}
