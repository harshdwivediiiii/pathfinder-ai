import { describe, it, expect } from 'vitest';
import { calculateTrafficRoute } from '../app/(main)/traffic-router/_components/traffic-algorithm.js';

describe('Traffic Router Algorithm', () => {
  it('calculates a route avoiding red lights', () => {
    // 3x3 map
    // (1,1) is an intersection with a red light at time T=1.
    // (0,2) is not an intersection, so it has no wait time.
    const mapData = [
      [{ isIntersection: false, cycleLength: 0, offset: 0 }, { isIntersection: false, cycleLength: 0, offset: 0 }, { isIntersection: false, cycleLength: 0, offset: 0 }],
      [{ isIntersection: false, cycleLength: 0, offset: 0 }, { isIntersection: true, cycleLength: 20, offset: 15 }, { isIntersection: false, cycleLength: 0, offset: 0 }],
      [{ isIntersection: false, cycleLength: 0, offset: 0 }, { isIntersection: false, cycleLength: 0, offset: 0 }, { isIntersection: false, cycleLength: 0, offset: 0 }]
    ];
    
    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 2 };
    
    // Speed factor is 1
    // Reaching (1,1) takes t=2.
    // Cycle length is 20, offset is 15.
    // currentCycleTime = (2 + 15) % 20 = 17. 
    // Green is < 10 (20/2). 17 is >= 10, so it's red!
    // Wait time = 20 - 17 = 3.
    // Path through (1,1) would cost 4 (distance) + 3 (wait) = 7.
    // Path around the edge (e.g. (0,0) -> (0,1) -> (0,2) -> (1,2) -> (2,2)) costs 4.
    
    const result = calculateTrafficRoute(start, end, mapData, 1);
    expect(result.status).toBe("Green Wave Synchronized Route Found");
    
    // It should detour around the red light at (1,1)
    const avoidedRedLight = !result.path.some(p => p.x === 1 && p.y === 1);
    expect(avoidedRedLight).toBe(true);
    expect(result.totalTime).toBe(4);
  });
});
