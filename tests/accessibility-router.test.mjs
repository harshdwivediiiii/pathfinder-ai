import { describe, it, expect } from 'vitest';
import { calculateAccessibleRoute } from '../app/(main)/accessibility-router/_components/accessibility-algorithm.js';

describe('Accessibility Router Algorithm', () => {
  it('blocks routes that contain stairs', () => {
    // 3x3 map
    // (0,1) and (1,1) have stairs.
    // (2,1) has a steep incline (10 deg).
    const mapData = [
      [{ incline: 0, hasStairs: false, missingCurbCut: false }, { incline: 0, hasStairs: false, missingCurbCut: false }, { incline: 0, hasStairs: false, missingCurbCut: false }],
      [{ incline: 0, hasStairs: true, missingCurbCut: false }, { incline: 0, hasStairs: true, missingCurbCut: false }, { incline: 10, hasStairs: false, missingCurbCut: false }],
      [{ incline: 0, hasStairs: false, missingCurbCut: false }, { incline: 0, hasStairs: false, missingCurbCut: false }, { incline: 0, hasStairs: false, missingCurbCut: false }]
    ];
    
    const start = { x: 0, y: 0 };
    const end = { x: 0, y: 2 };
    
    // Max incline is 5.
    // The only path down is blocked by stairs at x=0, y=1 and x=1, y=1.
    // And x=2, y=1 has an incline of 10, which exceeds max 5.
    // So there should be NO route.
    
    const result = calculateAccessibleRoute(start, end, mapData, 5);
    expect(result.status).toBe("No Accessible Route Found");
    expect(result.path.length).toBe(0);
  });

  it('detours around steep inclines to find a flat path', () => {
    // 3x3 map
    // Middle row (y=1) has an incline of 10 at x=0, 10 at x=1, and 2 at x=2.
    const mapData = [
      [{ incline: 0, hasStairs: false, missingCurbCut: false }, { incline: 0, hasStairs: false, missingCurbCut: false }, { incline: 0, hasStairs: false, missingCurbCut: false }],
      [{ incline: 10, hasStairs: false, missingCurbCut: false }, { incline: 10, hasStairs: false, missingCurbCut: false }, { incline: 2, hasStairs: false, missingCurbCut: false }],
      [{ incline: 0, hasStairs: false, missingCurbCut: false }, { incline: 0, hasStairs: false, missingCurbCut: false }, { incline: 0, hasStairs: false, missingCurbCut: false }]
    ];
    
    const start = { x: 0, y: 0 };
    const end = { x: 0, y: 2 };
    
    // Max incline is 5.
    // It must detour through x=2, y=1 where incline is 2.
    
    const result = calculateAccessibleRoute(start, end, mapData, 5);
    expect(result.status).toBe("Accessible Route Verified");
    
    const detoured = result.path.some(p => p.x === 2 && p.y === 1);
    expect(detoured).toBe(true);
  });
});
