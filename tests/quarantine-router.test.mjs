import { describe, it, expect, beforeEach } from 'vitest';
import { QuarantineRouter } from '../lib/ai/quarantine-router.js';

describe('QuarantineRouter', () => {
  let router;
  
  beforeEach(() => {
    router = new QuarantineRouter(60); // 60 minute contamination window
  });

  it('routes a CLEAN vehicle with no delay if no DIRTY vehicles are present', () => {
    const graph = {
      edges: {
        'Gate': ['CheckpointA'],
        'CheckpointA': ['Hospital']
      }
    };

    const result = router.routeFleet(graph, 'Gate', 'Hospital', 0, 'CLEAN');

    expect(result.status).toBe('success');
    expect(result.path.length).toBe(3);
    // Gate(t=0) -> CheckpointA(t=1) -> Hospital(t=2)
    expect(result.path[2].time).toBe(2); 
  });

  it('forces a CLEAN vehicle to wait if a DIRTY vehicle recently contaminated the intersection', () => {
    const graph = {
      edges: {
        'Gate': ['Intersection'],
        'Intersection': ['Hospital']
      }
    };

    // A DIRTY waste truck passes through the intersection at t=10
    router.logVehiclePath([{id: 'Intersection'}], [10], 'DIRTY');

    // A CLEAN truck arrives at Gate at t=0. 
    // It takes 1 min to reach Intersection. 
    // If it leaves immediately, it hits Intersection at t=1, safely BEFORE the dirty truck (t=10).
    // Wait, the router allows it if t < log.timestamp? 
    // Let's test the OTHER way. Dirty truck was there at t=0.
    
    router.clearLog();
    // Dirty truck was at Intersection at t = 0
    router.logVehiclePath([{id: 'Intersection'}], [0], 'DIRTY');

    // Clean truck arrives at Gate at t = 0
    // If it leaves immediately, it hits Intersection at t=1. 
    // But Intersection is contaminated from t=0 to t=60.
    // So the Clean truck must WAIT at the Gate until t=60, then hit Intersection at t=61.
    const result = router.routeFleet(graph, 'Gate', 'Hospital', 0, 'CLEAN');

    expect(result.status).toBe('success');
    
    // Check when it reached the intersection
    const intersectionStep = result.path.find(p => p.node === 'Intersection');
    // Must be > 60 to clear the contamination window
    expect(intersectionStep.time).toBeGreaterThan(60);
    
    // Total path should reflect the wait time at the Gate
    expect(result.path[0].node).toBe('Gate');
  });

  it('refuses to enter the quarantine zone if the only path is permanently contaminated', () => {
    const graph = {
      edges: {
        'Gate': ['HotZone'],
        'HotZone': ['Hospital']
      }
    };

    // A dirty truck is parked permanently at the HotZone (logged continually or recently)
    // We log it at t=0. Clean truck arrives at t=0. Wait time is 60.
    // Let's say the contamination window is 500 minutes (massive spill).
    const strictRouter = new QuarantineRouter(500);
    strictRouter.logVehiclePath([{id: 'HotZone'}], [0], 'DIRTY');

    // Clean truck tries to enter. Max wait threshold in our A* is 300.
    // So it will wait 300 minutes, give up, and return 'no_safe_path'.
    const result = strictRouter.routeFleet(graph, 'Gate', 'Hospital', 0, 'CLEAN');

    expect(result.status).toBe('no_safe_path');
  });
});
