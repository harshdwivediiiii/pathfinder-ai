import { describe, it, expect } from 'vitest';
import { SubterraneanRouter } from '../lib/ai/subterranean-router.js';

describe('SubterraneanRouter', () => {
  it('avoids a short direct line through solid granite in favor of a longer detour through soft soil', () => {
    const router = new SubterraneanRouter();

    const startNode = { id: 'Office', x: 0, y: 0 };
    const endNode = { id: 'DataCenter', x: 1000, y: 0 }; // 1000 meters away

    // Path 1: Direct line, 1000m, through solid granite mountain
    const directGraniteEdge = { lengthMeters: 1000, geology: 'SOLID_GRANITE' };
    
    // Path 2: Detour, 2500m, through soft soil valley
    const detourSoilEdge = { lengthMeters: 2500, geology: 'SOFT_SOIL' };

    const mockGraph = {
      paths: [
        { name: 'Direct Granite', nodes: [startNode, endNode], edges: [directGraniteEdge] },
        { name: 'Detour Soil', nodes: [startNode, { id: 'Valley', x: 500, y: 1000 }, endNode], edges: [detourSoilEdge, detourSoilEdge] }
        // Using detourSoilEdge twice just as a mock for a 5000m total path to be extremely clear
      ]
    };

    const result = router.routeCable(mockGraph, 'Office', 'DataCenter');

    // Cost calculations:
    // Granite: 1000m * 2000 = $2,000,000
    // Detour: 5000m * 100 = $500,000
    // Algorithm must choose Detour.

    expect(result.status).toBe('success');
    expect(result.path.includes('Valley')).toBe(true);
    expect(result.totalCost).toBe(500000);
  });

  it('seeks out existing utility conduits to drastically lower the budget, even if zigzagging', () => {
    const router = new SubterraneanRouter();

    const startNode = { id: 'NodeA', x: 0, y: 0 };
    const endNode = { id: 'NodeB', x: 500, y: 0 };

    // Path 1: Direct through soil. 500m * 100 = $50,000
    const directSoilEdge = { lengthMeters: 500, geology: 'SOFT_SOIL' };
    
    // Path 2: Huge zigzag through existing conduits. 2000m * 10 = $20,000
    const conduitEdge = { lengthMeters: 2000, geology: 'EXISTING_CONDUIT' };

    const mockGraph = {
      paths: [
        { name: 'Direct Trench', nodes: [startNode, endNode], edges: [directSoilEdge] },
        { name: 'Zigzag Conduit', nodes: [startNode, { id: 'Zig' }, { id: 'Zag' }, endNode], edges: [conduitEdge, {lengthMeters: 0, geology: 'EXISTING_CONDUIT'}, {lengthMeters: 0, geology: 'EXISTING_CONDUIT'}] }
        // Keeping it simple, only the first edge has length 2000 for calculation
      ]
    };

    const result = router.routeCable(mockGraph, 'NodeA', 'NodeB');

    expect(result.status).toBe('success');
    expect(result.path.includes('Zig')).toBe(true);
    expect(result.totalCost).toBe(20000); // 20000 is much cheaper than 50000
  });
});
