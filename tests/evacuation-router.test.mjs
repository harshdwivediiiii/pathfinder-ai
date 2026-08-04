import { describe, it, expect } from 'vitest';
import { generateEvacuationMap, calculateEvacuationRoutes } from '../app/(main)/evacuation-router/_components/evacuation-algorithm.js';

describe('Macroscopic Evacuation Router', () => {
  it('distributes load when load balancing is enabled', () => {
    // 5x5 map.
    // Center is (2,2).
    // Let's create a map where (0,2) is a highway, (4,2) is a highway, rest are local roads.
    // The generator makes x=1 and x=3 highways (30% and 70% of 5).
    // And y=1 and y=3 highways.
    
    const mapData = generateEvacuationMap(5, 5, 42);
    
    // We send 100 vehicles from the center (2,2).
    const vehicles = Array(100).fill({ x: 2, y: 2 });
    
    // Without load balancing, they all take the exact same shortest path to the highway.
    const resultNoLB = calculateEvacuationRoutes(mapData, vehicles, false);
    
    // The load on the network will just be heavily concentrated on a single escape route.
    let maxLoadNoLB = 0;
    for(let y=0; y<5; y++) {
        for(let x=0; x<5; x++){
            if(resultNoLB.simMap[y][x].currentLoad > maxLoadNoLB) maxLoadNoLB = resultNoLB.simMap[y][x].currentLoad;
        }
    }
    // They should all stack up on the same path, so maxLoad = 100. (Technically we don't apply load to simMap if LB is false in our current logic, wait.
    // In our logic: if(enableLoadBalancing) { apply load to simMap }. 
    // Let's check the logic: we only apply load if enableLoadBalancing is true. 
    // Let's just test that WITH load balancing, multiple nodes get used.
    
    const resultWithLB = calculateEvacuationRoutes(mapData, vehicles, true);
    
    let usedNodesWithLB = 0;
    for(let y=0; y<5; y++) {
        for(let x=0; x<5; x++){
            if(resultWithLB.simMap[y][x].currentLoad > 0) usedNodesWithLB++;
        }
    }
    
    // If they all took the same path, it would be maybe 3 nodes used.
    // Because of load balancing pushing them to other routes, it should be significantly higher.
    expect(usedNodesWithLB).toBeGreaterThan(5); 
  });
});
