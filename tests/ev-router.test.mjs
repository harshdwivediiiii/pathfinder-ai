import { describe, it, expect } from 'vitest';
import { calculateEVRoute } from '../app/(main)/ev-router/_components/ev-algorithm.js';

describe('EV Router Algorithm', () => {
  it('calculates a successful route without charging', () => {
    const elevationMap = [
      [10, 10, 10],
      [10, 10, 10],
      [10, 10, 10]
    ];
    const stations = [];
    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 2 };
    
    const result = calculateEVRoute(start, end, elevationMap, stations, 100, 100);
    expect(result.status).toBe("Optimal Eco-Route Calculated");
    expect(result.path.length).toBeGreaterThan(0);
  });

  it('reaches a station and resets to maxBattery before continuing', () => {
    const elevationMap = [
      [10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10]
    ];
    const stations = [{ x: 2, y: 0 }];
    const start = { x: 0, y: 0 };
    const end = { x: 4, y: 0 };
    
    // Very low starting battery, just enough to reach the station (distance 2, base cost 1 per step = 2 energy)
    // Actually, with elev diff 0, cost is 1. Next battery = current - 1
    const result = calculateEVRoute(start, end, elevationMap, stations, 2.5, 100);
    expect(result.status).toBe("Optimal Eco-Route Calculated");
    
    // The path should go through the station at (2,0)
    const charged = result.path.find(p => p.x === 2 && p.y === 0);
    expect(charged.charge).toBe(true);
  });

  it('fails with unreachable destination', () => {
    const elevationMap = [
      [10, 10, 10],
      [10, 10, 10],
      [10, 10, 10]
    ];
    const stations = [];
    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 2 };
    
    // Start battery is too low to reach destination
    const result = calculateEVRoute(start, end, elevationMap, stations, 1, 100);
    expect(result.status).toBe("Route Failed: Insufficient Range & Charging Infrastructure");
    expect(result.path).toEqual([]);
  });
});
