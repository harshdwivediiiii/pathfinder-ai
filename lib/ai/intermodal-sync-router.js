export class IntermodalSyncRouter {
  constructor(baseGraph) {
    this.graph = baseGraph;
    this.trainSchedules = new Map();
  }

  ingestTrainSchedule(terminalId, departureTime, craneLoadTime) {
    this.trainSchedules.set(terminalId, { departureTime, craneLoadTime });
  }

  calculateJITCost(arrivalTime, targetTime, maxEarlyBuffer = 60) {
    // If the truck arrives after the target time, it misses the train (infinite cost)
    if (arrivalTime > targetTime) {
      return Infinity; 
    }
    
    // If the truck arrives, calculate how early it is
    const earlyBy = targetTime - arrivalTime;
    
    // If it's too early, penalize heavily (yard congestion/dwell time)
    if (earlyBy > maxEarlyBuffer) {
      return earlyBy * 10; // Massive penalty for sitting idle
    }
    
    // Perfect JIT arrival has 0 penalty. Slight earliness is okay.
    return earlyBy; 
  }

  routeTruckToTerminal(startId, terminalId, dispatchTime) {
    if (!this.graph || !this.graph.edges) return { path: [], status: 'no_graph' };
    
    const schedule = this.trainSchedules.get(terminalId);
    if (!schedule) return { path: [], status: 'no_schedule_found' };
    
    // The absolute latest the truck can arrive to get loaded
    const targetArrivalTime = schedule.departureTime - schedule.craneLoadTime;

    let bestPath = [];
    let bestCost = Infinity;
    let finalArrivalTime = 0;

    // Simulate exploring predetermined paths (stub)
    const possiblePaths = [
      { id: 'highway_fast', edges: ['A-B', 'B-Terminal'], travelTime: 120 }, // Fast, but might arrive way too early
      { id: 'scenic_slow', edges: ['A-C', 'C-Terminal'], travelTime: 240 }  // Slower, might hit JIT perfectly
    ];

    possiblePaths.forEach(p => {
      const arrivalTime = dispatchTime + p.travelTime;
      const jitCost = this.calculateJITCost(arrivalTime, targetArrivalTime);
      
      // We optimize purely for JIT cost in this specialized intermodal router
      if (jitCost < bestCost) {
        bestCost = jitCost;
        bestPath = ['A', ...p.edges.map(e => e.split('-')[1])];
        finalArrivalTime = arrivalTime;
      }
    });

    return {
      path: bestPath,
      arrivalTime: finalArrivalTime,
      targetTime: targetArrivalTime,
      jitCost: bestCost,
      status: bestPath.length > 0 ? 'success' : 'missed_connection'
    };
  }
}
