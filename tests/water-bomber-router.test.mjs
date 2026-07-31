import { describe, it, expect } from 'vitest';
import { WaterBomberRouter } from '../lib/ai/water-bomber-router.js';

describe('WaterBomberRouter', () => {
  it('selects a further lake if the visually closer lake is blocked by an impassable smoke plume', () => {
    const router = new WaterBomberRouter();

    const aircraft = { id: 'Aircraft', x: 0, y: 0 };
    const fire = { id: 'FireFront', x: 200, y: 0 };

    const lakeNear = { id: 'LakeNear', x: 50, y: 0 }; 
    const lakeFar = { id: 'LakeFar', x: -50, y: 100 };

    const mockGraph = {
      paths: [
        // Aircraft to LakeNear (distance 50)
        { nodes: [aircraft, lakeNear], edges: [{ id: 'a-near', lengthMeters: 50 }] },
        // LakeNear to FireFront (distance 150)
        { nodes: [lakeNear, fire], edges: [{ id: 'near-fire', lengthMeters: 150 }] },
        
        // Aircraft to LakeFar (distance 111)
        { nodes: [aircraft, lakeFar], edges: [{ id: 'a-far', lengthMeters: 111 }] },
        // LakeFar to FireFront (distance 269)
        { nodes: [lakeFar, fire], edges: [{ id: 'far-fire', lengthMeters: 269 }] }
      ]
    };

    const smokeData = {
      'a-near': 0,
      'near-fire': 0.9, // 0.9 is > 0.8, which triggers Infinity (impassable smoke plume)
      'a-far': 0,
      'far-fire': 0
    };

    const result = router.generateCyclicRoute(mockGraph, 'Aircraft', 'FireFront', ['LakeNear', 'LakeFar'], smokeData);

    expect(result.status).toBe('success');
    
    // Physically, LakeNear is much closer. But the path from LakeNear to the FireFront is blocked by 0.9 smoke density.
    // The algorithm must abandon LakeNear and route to LakeFar instead.
    expect(result.waterSource).toBe('LakeFar');
    expect(result.route).toEqual(['Aircraft', 'LakeFar', 'FireFront']);
  });

  it('generates a continuous 3-node cyclic route avoiding moderate smoke', () => {
    const router = new WaterBomberRouter();

    const aircraft = { id: 'Aircraft', x: 0, y: 0 };
    const fire = { id: 'FireFront', x: 100, y: 0 };
    const lake = { id: 'Lake', x: 50, y: 50 };

    const mockGraph = {
      paths: [
        { nodes: [aircraft, lake], edges: [{ id: 'a-lake', lengthMeters: 70 }] },
        { nodes: [aircraft, {id:'Detour'}, lake], edges: [{ id: 'detour1', lengthMeters: 50 }, { id: 'detour2', lengthMeters: 50 }] },
        { nodes: [lake, fire], edges: [{ id: 'lake-fire', lengthMeters: 70 }] }
      ]
    };

    const smokeData = {
      'a-lake': 0.5, // moderate smoke, cost increases significantly
      'detour1': 0,
      'detour2': 0,
      'lake-fire': 0
    };

    const result = router.generateCyclicRoute(mockGraph, 'Aircraft', 'FireFront', ['Lake'], smokeData);

    expect(result.status).toBe('success');
    // It should take the detour to the lake, then straight to fire
    expect(result.route).toEqual(['Aircraft', 'Detour', 'Lake', 'FireFront']);
  });
});
