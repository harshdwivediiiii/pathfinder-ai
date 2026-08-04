import { describe, it, expect } from 'vitest';
import { generateAirspaceMap, calculate3DAirspaceRoute } from '../app/(main)/airspace-deconfliction/_components/airspace-algorithm.js';

describe('3D Airspace Deconfliction Routing', () => {
  it('forces higher altitude flights over residential areas when noise limits are enforced', () => {
    
    // Create a small map where all nodes are residential
    const map = generateAirspaceMap(10, 10, 10, 42);
    for(let y=0; y<10; y++){
        for(let x=0; x<10; x++){
            map[y][x].isResidential = true;
            map[y][x].buildingHeight = 0; // No buildings to simplify altitude test
        }
    }
    
    const start = { x: 0, y: 0, z: 1 };
    const end = { x: 9, y: 9, z: 1 };
    
    // Without noise limits, it should just fly straight at low altitude (z=1)
    const routeNoLimits = calculate3DAirspaceRoute(start, end, map, 10, false);
    
    let maxAltNoLimits = 0;
    routeNoLimits.forEach(n => { if (n.z > maxAltNoLimits) maxAltNoLimits = n.z; });
    
    expect(maxAltNoLimits).toBeLessThan(5); 
    
    // With noise limits, it should be heavily penalized for flying low over residential.
    // It should climb to at least maxAltitude * 0.5 (which is 5).
    const routeWithLimits = calculate3DAirspaceRoute(start, end, map, 10, true);
    
    let maxAltWithLimits = 0;
    routeWithLimits.forEach(n => { if (n.z > maxAltWithLimits) maxAltWithLimits = n.z; });
    
    expect(maxAltWithLimits).toBeGreaterThanOrEqual(5); 
  });
});
