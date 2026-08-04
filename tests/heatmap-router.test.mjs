import { describe, it, expect } from 'vitest';
import { calculateSafeRoute } from '../app/(main)/heatmap-router/_components/heatmap-algorithm.js';

describe('Historical Accident Heatmap Router', () => {
  it('detours around high accident areas when risk aversion is high', () => {
    // 3x3 map
    // (0,1) and (1,1) have high accident heat.
    const mapData = [
      [{ heat: 0.0 }, { heat: 0.0 }, { heat: 0.0 }],
      [{ heat: 1.0 }, { heat: 1.0 }, { heat: 0.0 }],
      [{ heat: 0.0 }, { heat: 0.0 }, { heat: 0.0 }]
    ];
    
    const start = { x: 0, y: 0 };
    const end = { x: 0, y: 2 };
    
    // Low risk aversion: Path is just straight down (0,0) -> (0,1) -> (0,2). Cost = 2 + (1.0 * 0) = 2.
    // High risk aversion: (0,1) costs 1 + (1.0 * 10) = 11.
    // Detour: (0,0) -> (1,0) -> (2,0) -> (2,1) -> (2,2) -> (1,2) -> (0,2) = 6 steps. Cost = 6. 
    // 6 < 11, so it should detour.
    
    const result = calculateSafeRoute(start, end, mapData, 10);
    expect(result.status).toBe("Safest Route Calculated");
    
    // Path MUST detour and should NOT contain the high-heat nodes
    const wentThroughHeat = result.path.some(p => mapData[p.y][p.x].heat >= 1.0);
    expect(wentThroughHeat).toBe(false);
  });
});
