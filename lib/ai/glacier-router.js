export class GlacierRouter {
  // Helper to calculate 2D Euclidean distance (in meters)
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Evaluates risk based on Ground Penetrating Radar (GPR) and Synthetic-Aperture Radar (SAR)
  evaluateGprRisk(node, sensorData) {
    const gpr = sensorData.gpr || {};
    const sar = sensorData.sar || {};

    const nodeGpr = gpr[node.id];
    const nodeSar = sar[node.id];

    if (!nodeGpr && !nodeSar) {
      return 'SAFE'; // No anomalies detected
    }

    // GPR detects an empty void below the surface
    const hasSubsurfaceVoid = nodeGpr && nodeGpr.voidDepth < 50; 
    
    // SAR detects surface tension/sagging (classic snow bridge signature)
    const hasSurfaceSag = nodeSar && nodeSar.surfaceTensionAnomaly === true;

    if (hasSubsurfaceVoid && !hasSurfaceSag) {
      // Hidden sub-surface crevasse, completely invisible from the surface
      return 'UNSAFE_CREVASSE';
    }

    if (hasSubsurfaceVoid && hasSurfaceSag) {
      // It's a snow bridge. It might hold, it might not. Extremely high risk.
      if (nodeGpr.bridgeThickness > 10) {
        return 'CERTIFIED_SNOW_BRIDGE'; // Thick enough to hold a tracked vehicle
      }
      return 'DANGEROUS_SNOW_BRIDGE';
    }

    // Open crevasse visible from satellite
    if (!hasSubsurfaceVoid && hasSurfaceSag) {
      return 'UNSAFE_CREVASSE';
    }

    return 'SAFE';
  }

  // Calculates routing cost along an edge
  calculateEdgeCost(nodeA, nodeB, sensorData) {
    const distance = this.calculateDistance(nodeA, nodeB);
    
    // Evaluate risk at the destination node of the edge
    const riskLevel = this.evaluateGprRisk(nodeB, sensorData);

    if (riskLevel === 'UNSAFE_CREVASSE') {
      return Infinity; // Impassable
    }

    if (riskLevel === 'DANGEROUS_SNOW_BRIDGE') {
      return distance * 1000; // Exponential penalty, avoid unless absolutely no other way
    }

    if (riskLevel === 'CERTIFIED_SNOW_BRIDGE') {
      return distance * 2; // Slight penalty, requires caution
    }

    // SAFE
    return distance;
  }

  routeExpedition(graph, startId, endId, sensorData = { gpr: {}, sar: {} }) {
    let bestPath = [];
    let bestCost = Infinity;

    graph.paths.forEach(path => {
      let currentCost = 0;
      let valid = true;
      
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const cost = this.calculateEdgeCost(path.nodes[i], path.nodes[i+1], sensorData);
        if (cost === Infinity) {
          valid = false;
          break;
        }
        currentCost += cost;
      }

      if (valid && currentCost < bestCost) {
        bestCost = currentCost;
        bestPath = path.nodes.map(n => n.id);
      }
    });

    if (bestPath.length === 0) {
      return { status: 'no_safe_path_found', cost: Infinity, path: [] };
    }

    return { status: 'success', cost: bestCost, path: bestPath };
  }
}
