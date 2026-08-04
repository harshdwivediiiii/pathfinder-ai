import { describe, it, expect } from 'vitest';
import { calculatePotholeRoute } from '../app/(main)/pothole-router/_components/pothole-algorithm.js';

describe('Computer Vision-Based Pothole Detection Router', () => {
  it('detours around craters when suspension sensitivity is high', () => {
    // 3x3 map
    // (0,1) and (1,1) have craters.
    const mapData = [
      [{ anomalyType: 'none', severity: 0 }, { anomalyType: 'none', severity: 0 }, { anomalyType: 'none', severity: 0 }],
      [{ anomalyType: 'crater', severity: 10 }, { anomalyType: 'crater', severity: 10 }, { anomalyType: 'none', severity: 0 }],
      [{ anomalyType: 'none', severity: 0 }, { anomalyType: 'none', severity: 0 }, { anomalyType: 'none', severity: 0 }]
    ];
    
    const start = { x: 0, y: 0 };
    const end = { x: 0, y: 2 };
    
    // With high sensitivity, hitting a crater costs 1 + 10 * 10 = 101.
    // Detouring around costs 6.
    
    const result = calculatePotholeRoute(start, end, mapData, 10);
    expect(result.status).toBe("Vehicle-Preserving Route Calculated");
    
    // Path MUST detour and should NOT contain the crater nodes
    const hitCrater = result.path.some(p => mapData[p.y][p.x].anomalyType === 'crater');
    expect(hitCrater).toBe(false);
  });
});
