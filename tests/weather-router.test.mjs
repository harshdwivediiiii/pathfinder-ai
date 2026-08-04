import { describe, it, expect } from 'vitest';
import { calculateWeatherRoute } from '../app/(main)/weather-router/_components/weather-algorithm.js';

describe('Weather Router Algorithm', () => {
  it('calculates a safe route in clear weather', () => {
    // 3x3 map, all flat paved
    const mapData = [
      [{ elevation: 10, material: 'paved' }, { elevation: 10, material: 'paved' }, { elevation: 10, material: 'paved' }],
      [{ elevation: 10, material: 'paved' }, { elevation: 10, material: 'paved' }, { elevation: 10, material: 'paved' }],
      [{ elevation: 10, material: 'paved' }, { elevation: 10, material: 'paved' }, { elevation: 10, material: 'paved' }]
    ];
    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 2 };
    
    const result = calculateWeatherRoute(start, end, mapData, 0);
    expect(result.status).toBe("Safe Weather Route Calculated");
    expect(result.path.length).toBeGreaterThan(0);
  });

  it('avoids steep dirt roads during severe weather', () => {
    // 3x3 map
    // Top row: steep dirt
    // Middle row: flat paved (safe detour)
    // Bottom row: start and end
    const mapData = [
      [{ elevation: 0, material: 'dirt' }, { elevation: 100, material: 'dirt' }, { elevation: 0, material: 'dirt' }],
      [{ elevation: 0, material: 'paved' }, { elevation: 0, material: 'paved' }, { elevation: 0, material: 'paved' }],
      [{ elevation: 0, material: 'paved' }, { elevation: 0, material: 'paved' }, { elevation: 0, material: 'paved' }]
    ];
    const start = { x: 0, y: 0 };
    const end = { x: 2, y: 0 };
    
    // High weather severity should force path to detour through the paved area
    const result = calculateWeatherRoute(start, end, mapData, 10);
    expect(result.status).toBe("Safe Weather Route Calculated");
    
    // Path should go down to y=1 to avoid the steep dirt penalty
    const usedSafeDetour = result.path.some(p => p.y === 1 || p.y === 2);
    expect(usedSafeDetour).toBe(true);
  });
});
