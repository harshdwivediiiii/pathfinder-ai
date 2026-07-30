export class OpportunisticChargingRouter {
  constructor(baseGraph) {
    this.graph = baseGraph;
    this.chargingPads = new Map();
  }

  ingestChargingInfrastructure(pads) {
    // Expected format: [{ edgeId: 'A-C', chargePerSecond: 1.5 }, ...]
    pads.forEach(pad => {
      this.chargingPads.set(pad.edgeId, pad);
    });
  }

  calculateEdgeCost(edge, currentBatteryPercent, robotSpeed, batteryDrainRate) {
    const travelTime = edge.distance / robotSpeed;
    const baseDrain = travelTime * batteryDrainRate;
    
    let netBatteryChange = -baseDrain;
    let cost = travelTime;

    const pad = this.chargingPads.get(edge.id);
    if (pad) {
      const chargeGained = travelTime * pad.chargePerSecond;
      netBatteryChange += chargeGained;
      
      // If we are gaining battery, reduce the "cost" heuristically to incentivize taking this route
      // The lower the battery, the higher the incentive (reward) for charging
      const batteryAnxiety = Math.max(1, 100 / (currentBatteryPercent + 1));
      cost -= (chargeGained * batteryAnxiety);
    }
    
    // Ensure cost doesn't drop below a minimum threshold to avoid negative cycles
    cost = Math.max(cost, travelTime * 0.1);

    return { cost, netBatteryChange, travelTime };
  }

  route(startId, endId, initialBattery = 100, robotSpeed = 5, batteryDrainRate = 0.5) {
    if (!this.graph || !this.graph.edges) return { path: [], status: 'no_graph' };

    let bestPath = [];
    let bestHeuristicCost = Infinity;
    let finalBattery = 0;
    let finalTime = 0;

    // Simulate exploring 2 predetermined paths (stub)
    const possiblePaths = [
      { id: 'path_shortest', edges: ['A-B', 'B-End'] },
      { id: 'path_charging_detour', edges: ['A-C', 'C-End'] }
    ];

    possiblePaths.forEach(p => {
      let heuristicCost = 0;
      let totalTime = 0;
      let battery = initialBattery;
      let valid = true;

      p.edges.forEach(edgeId => {
        if (!valid) return;

        const edge = this.graph.edges.find(e => e.id === edgeId);
        if (edge) {
          const { cost, netBatteryChange, travelTime } = this.calculateEdgeCost(
            edge, battery, robotSpeed, batteryDrainRate
          );
          
          heuristicCost += cost;
          totalTime += travelTime;
          battery += netBatteryChange;

          if (battery <= 0) {
             valid = false; // Dead battery
          }
        } else {
          valid = false;
        }
      });
      
      if (valid && heuristicCost < bestHeuristicCost) {
        bestHeuristicCost = heuristicCost;
        bestPath = ['A', ...p.edges.map(e => e.split('-')[1])];
        finalBattery = battery;
        finalTime = totalTime;
      }
    });

    return {
      path: bestPath,
      finalBattery,
      totalTime: finalTime,
      status: bestPath.length > 0 ? 'success' : 'out_of_battery'
    };
  }
}
