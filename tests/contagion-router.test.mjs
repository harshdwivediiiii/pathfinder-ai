import { describe, it, expect } from 'vitest';
import { ContagionRouter } from '../lib/ai/contagion-router.js';

describe('ContagionRouter', () => {
  it('routes a HIGH_VULNERABILITY user through a longer park path to avoid a viral transit hub', () => {
    const router = new ContagionRouter();

    const startNode = { id: 'Home', x: 0, y: 0 };
    const endNode = { id: 'Clinic', x: 1000, y: 0 }; 

    // Path 1: Direct route through a transit hub (1000m)
    const transitHub = { id: 'SubwayStation', x: 500, y: 0, type: 'ENCLOSED_TRANSIT_HUB' };
    const directEdge1 = { lengthMeters: 500 };
    const directEdge2 = { lengthMeters: 500 };

    // Path 2: Detour through open park (2000m total)
    const parkNode = { id: 'CentralPark', x: 500, y: 1000, type: 'OPEN_PARK' };
    const detourEdge1 = { lengthMeters: 1000 };
    const detourEdge2 = { lengthMeters: 1000 };

    const mockGraph = {
      paths: [
        { name: 'Direct Transit', nodes: [startNode, transitHub, endNode], edges: [directEdge1, directEdge2] },
        { name: 'Park Detour', nodes: [startNode, parkNode, endNode], edges: [detourEdge1, detourEdge2] }
      ]
    };

    // Public health data indicates a moderate viral load at the transit hub
    const healthData = {
      viralLoads: {
        'SubwayStation': 0.5,
        'CentralPark': 0.0 // Clear
      }
    };

    const result = router.routePedestrian(mockGraph, 'Home', 'Clinic', healthData, 'HIGH_VULNERABILITY');

    expect(result.status).toBe('success');
    // The exponential penalty for the high-vulnerability user should force them into the 2000m park detour
    // Transit Hub Node Risk Multiplier: (1 + 0.5 * 10) * 3 = 6 * 3 = 18.
    // Penalty for High Vuln = 18^2 = 324. Edge Cost = 500 * 324 = 162,000.
    // Park Node Risk Multiplier: (1 + 0) * 0.2 = 0.2.
    // Cost = 1000. (Since nodeRisk <= 1.0, cost is just distance 1000). Total detour = 2000.
    expect(result.path.includes('CentralPark')).toBe(true);
    expect(result.path.includes('SubwayStation')).toBe(false);
  });

  it('allows a NORMAL immunity user to take the direct path if the viral load is very low', () => {
    const router = new ContagionRouter();

    const startNode = { id: 'Home', x: 0, y: 0 };
    const endNode = { id: 'GroceryStore', x: 1000, y: 0 }; 

    // Path 1: Direct route through a standard narrow street (1000m)
    const narrowStreet = { id: 'Alley', x: 500, y: 0, type: 'NARROW_STREET' };
    const directEdge1 = { lengthMeters: 500 };
    const directEdge2 = { lengthMeters: 500 };

    // Path 2: Detour through open park (3000m total - much longer)
    const parkNode = { id: 'FarPark', x: 500, y: 1500, type: 'OPEN_PARK' };
    const detourEdge1 = { lengthMeters: 1500 };
    const detourEdge2 = { lengthMeters: 1500 };

    const mockGraph = {
      paths: [
        { name: 'Direct Alley', nodes: [startNode, narrowStreet, endNode], edges: [directEdge1, directEdge2] },
        { name: 'Park Detour', nodes: [startNode, parkNode, endNode], edges: [detourEdge1, detourEdge2] }
      ]
    };

    // Public health data indicates a VERY LOW viral load in the alley
    const healthData = {
      viralLoads: {
        'Alley': 0.05
      }
    };

    const result = router.routePedestrian(mockGraph, 'Home', 'GroceryStore', healthData, 'NORMAL');

    expect(result.status).toBe('success');
    
    // Risk Multiplier Alley = (1 + 0.05 * 10) * 1.5 = (1.5) * 1.5 = 2.25.
    // Cost for NORMAL = 500 * 2.25 = 1125 + 500 = 1625 total.
    // Park Detour = 1500 + 1500 = 3000 total.
    // Normal user takes the alley because 1625 < 3000.
    expect(result.path.includes('Alley')).toBe(true);
  });
});
