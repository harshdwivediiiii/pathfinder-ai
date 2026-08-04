import { describe, it, expect } from 'vitest';
import { calculateSafetyRoute } from '../app/(main)/safety-router/_components/safety-algorithm.js';

describe('Safety Router Algorithm', () => {
  it('calculates a route preferring well-lit streets at night', () => {
    // 3x3 map
    // Top row: completely unlit
    // Middle row: well lit (safer detour)
    // Bottom row: start and end
    const mapData = [
      [{ isLit: false, incidentDensity: 'low' }, { isLit: false, incidentDensity: 'low' }, { isLit: false, incidentDensity: 'low' }],
      [{ isLit: true, incidentDensity: 'low' }, { isLit: true, incidentDensity: 'low' }, { isLit: true, incidentDensity: 'low' }],
      [{ isLit: false, incidentDensity: 'low' }, { isLit: false, incidentDensity: 'low' }, { isLit: false, incidentDensity: 'low' }]
    ];
    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 0 };
    
    // High safety weight, night time is true
    const result = calculateSafetyRoute(start, end, mapData, 10, true);
    expect(result.status).toBe("Secure Route Identified");
    
    // Path should go down to y=1 to avoid the unlit path
    const usedLitDetour = result.path.some(p => p.y === 1 || p.y === 2);
    expect(usedLitDetour).toBe(true);
  });

  it('avoids high incident density areas', () => {
    // 3x3 map
    // Top row: high incident density
    // Middle row: low incident density
    const mapData = [
      [{ isLit: true, incidentDensity: 'high' }, { isLit: true, incidentDensity: 'high' }, { isLit: true, incidentDensity: 'high' }],
      [{ isLit: true, incidentDensity: 'low' }, { isLit: true, incidentDensity: 'low' }, { isLit: true, incidentDensity: 'low' }],
      [{ isLit: true, incidentDensity: 'low' }, { isLit: true, incidentDensity: 'low' }, { isLit: true, incidentDensity: 'low' }]
    ];
    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 0 };
    
    // High safety weight, night time is false
    const result = calculateSafetyRoute(start, end, mapData, 10, false);
    expect(result.status).toBe("Secure Route Identified");
    
    // Path should detour to avoid high incident zones
    const usedSafeDetour = result.path.some(p => p.y === 1 || p.y === 2);
    expect(usedSafeDetour).toBe(true);
  });
});
