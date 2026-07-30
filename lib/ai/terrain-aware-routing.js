export class TerrainAwareRouter {
  constructor(baseGraph, options = {}) {
    this.graph = baseGraph;
    this.fitnessLevel = options.fitnessLevel || 'average'; // beginner, average, athlete
  }

  calculateNaismithsRule(distanceMeters, elevationGainMeters) {
    // Naismith's rule: 1 hour for every 3 miles (5 km) forward, plus 1/2 hour for every 2000 ft (600m) of ascent.
    // Converted to seconds: (distance / 5000) * 3600 + (elevationGain / 600) * 1800
    let baseTime = (distanceMeters / 5000.0) * 3600.0;
    let elevationPenalty = elevationGainMeters > 0 ? (elevationGainMeters / 600.0) * 1800.0 : 0;
    return baseTime + elevationPenalty;
  }

  calculateToblersHikingFunction(gradient) {
    // Tobler's hiking function: W = 6 * exp(-3.5 * |dh/dx + 0.05|) in km/h
    // gradient is dh/dx
    let speedKmph = 6.0 * Math.exp(-3.5 * Math.abs(gradient + 0.05));
    return speedKmph;
  }

  ingestDEM(demData) {
    if (!this.graph || !this.graph.edges) return;
    
    // DEM data format: [{ edgeId: 1, elevationStart: 100, elevationEnd: 150 }]
    demData.forEach(dem => {
      const edge = this.graph.edges.find(e => e.id === dem.edgeId);
      if (edge) {
        edge.elevationGain = dem.elevationEnd - dem.elevationStart;
        edge.gradient = edge.distance ? edge.elevationGain / edge.distance : 0;
      }
    });
  }

  route(start, end) {
    if (!this.graph || !this.graph.edges) return { path: [], estimatedTimeSeconds: 0 };

    // Apply Tobler's function and Naismith's rule to modify edge weights
    this.graph.edges.forEach(edge => {
      if (edge.distance !== undefined && edge.elevationGain !== undefined) {
        // Calculate estimated time using Naismith's rule
        const naismithTime = this.calculateNaismithsRule(edge.distance, edge.elevationGain);
        
        // Calculate speed using Tobler's function
        const toblerSpeedKmph = this.calculateToblersHikingFunction(edge.gradient || 0);
        const toblerSpeedMps = toblerSpeedKmph * (1000.0 / 3600.0);
        const toblerTime = edge.distance / toblerSpeedMps;

        // Blend them based on fitness level (stub logic)
        let blendedTime = (naismithTime + toblerTime) / 2.0;

        if (this.fitnessLevel === 'beginner') {
          blendedTime *= 1.5;
        } else if (this.fitnessLevel === 'athlete') {
          blendedTime *= 0.7;
        }

        edge.weight = blendedTime; // time is the new weight
      }
    });

    // Stub path
    return { path: [start, end], estimatedTimeSeconds: 1200 };
  }
}
