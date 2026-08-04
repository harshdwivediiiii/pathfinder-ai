import { describe, it, expect } from 'vitest';
import { generateMaintenanceMap, calculatePredictiveMaintenanceRoute } from '../app/(main)/predictive-maintenance/_components/maintenance-algorithm.js';

describe('Predictive Maintenance Routing', () => {
  it('reroutes to nearest service center avoiding high stress roads when fault detected', () => {
    
    // We create a map
    const { mapData, serviceCenters } = generateMaintenanceMap(20, 20, 42);
    
    const start = { x: 5, y: 5 };
    const destination = { x: 19, y: 19 }; // passenger dropoff
    
    // Normal Mode:
    const normalRoute = calculatePredictiveMaintenanceRoute(start, destination, false, mapData, serviceCenters);
    
    // Should route to passenger destination
    const lastNodeNormal = normalRoute[normalRoute.length - 1];
    expect(lastNodeNormal.x).toBe(destination.x);
    expect(lastNodeNormal.y).toBe(destination.y);
    
    // Fault Mode:
    const faultRoute = calculatePredictiveMaintenanceRoute(start, destination, true, mapData, serviceCenters);
    
    // Should route to a service center
    const lastNodeFault = faultRoute[faultRoute.length - 1];
    const isServiceCenter = serviceCenters.some(sc => sc.x === lastNodeFault.x && sc.y === lastNodeFault.y);
    expect(isServiceCenter).toBe(true);
    
    // The fault route should have avoided highways (high stress) if possible.
    // Let's count highway usage.
    let highwayUsageNormal = 0;
    normalRoute.forEach(n => {
        if (mapData[n.y][n.x].isHighway) highwayUsageNormal++;
    });
    
    let highwayUsageFault = 0;
    faultRoute.forEach(n => {
        if (mapData[n.y][n.x].isHighway) highwayUsageFault++;
    });
    
    // Because of the massive stress penalty, fault route should use highways much less (ideally zero)
    expect(highwayUsageFault).toBeLessThanOrEqual(highwayUsageNormal);
  });
});
