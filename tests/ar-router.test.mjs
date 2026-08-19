import { describe, it, expect } from 'vitest';
import { calculateARRoute } from '../app/(main)/ar-router/_components/ar-algorithm.js';

describe('AR Router Algorithm', () => {
  it('calculates a route on the same floor', () => {
    // 1 floor, 3x3 map, no walls, no stairs
    const mapData = [[
      [{ wall: false, stairs: false }, { wall: false, stairs: false }, { wall: false, stairs: false }],
      [{ wall: false, stairs: false }, { wall: false, stairs: false }, { wall: false, stairs: false }],
      [{ wall: false, stairs: false }, { wall: false, stairs: false }, { wall: false, stairs: false }]
    ]];
    const start = { x: 0, y: 0, f: 0 };
    const end = { x: 2, y: 2, f: 0 };
    
    const result = calculateARRoute(start, end, mapData);
    expect(result.status).toBe("AR Waypoints Generated");
    expect(result.path.length).toBeGreaterThan(0);
  });

  it('calculates a route across floors using stairs', () => {
    // 2 floors, 3x3 map.
    // Stairs at (1,1)
    const mapData = [
      [ // Floor 0
        [{ wall: false, stairs: false }, { wall: false, stairs: false }, { wall: false, stairs: false }],
        [{ wall: false, stairs: false }, { wall: false, stairs: true  }, { wall: false, stairs: false }],
        [{ wall: false, stairs: false }, { wall: false, stairs: false }, { wall: false, stairs: false }]
      ],
      [ // Floor 1
        [{ wall: false, stairs: false }, { wall: false, stairs: false }, { wall: false, stairs: false }],
        [{ wall: false, stairs: false }, { wall: false, stairs: true  }, { wall: false, stairs: false }],
        [{ wall: false, stairs: false }, { wall: false, stairs: false }, { wall: false, stairs: false }]
      ]
    ];
    const start = { x: 0, y: 0, f: 0 };
    const end = { x: 2, y: 2, f: 1 };
    
    const result = calculateARRoute(start, end, mapData);
    expect(result.status).toBe("AR Waypoints Generated");
    
    // Check if it went to floor 1
    const reachedFloor1 = result.path.some(p => p.f === 1);
    expect(reachedFloor1).toBe(true);
  });

  it('fails if walls block the path', () => {
    // 1 floor, 3x3 map
    // Wall fully blocks the middle
    const mapData = [[
      [{ wall: false, stairs: false }, { wall: true, stairs: false }, { wall: false, stairs: false }],
      [{ wall: false, stairs: false }, { wall: true, stairs: false }, { wall: false, stairs: false }],
      [{ wall: false, stairs: false }, { wall: true, stairs: false }, { wall: false, stairs: false }]
    ]];
    const start = { x: 0, y: 0, f: 0 };
    const end = { x: 2, y: 0, f: 0 };
    
    const result = calculateARRoute(start, end, mapData);
    expect(result.status).toBe("Destination Unreachable");
    expect(result.path).toEqual([]);
  });
});
