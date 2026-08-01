import { describe, it, expect } from 'vitest';
import { SmartGridRouter } from '../lib/ai/smart-grid-router.js';

describe('SmartGridRouter', () => {
  it('diverts power away from a shorter but heavily loaded line to a longer, cooler backup line', () => {
    const router = new SmartGridRouter();

    const nodeA = { id: 'Plant' };
    const nodeB = { id: 'City' };
    const nodeC = { id: 'BackupSubstation' };

    // Direct line is heavily loaded (95/100 MW)
    const directEdge = { baseResistance: 1, currentLoad: 95, maxCapacity: 100 };
    
    // Backup line goes through C. It's twice as long (baseResistance 2), but completely empty.
    const backupEdge1 = { baseResistance: 1, currentLoad: 0, maxCapacity: 100 };
    const backupEdge2 = { baseResistance: 1, currentLoad: 0, maxCapacity: 100 };

    const mockGraph = {
      paths: [
        { name: 'Direct', nodes: [nodeA, nodeB], edges: [directEdge] },
        { name: 'Backup', nodes: [nodeA, nodeC, nodeB], edges: [backupEdge1, backupEdge2] }
      ]
    };

    // Requesting 4 MW. Direct line goes to 99/100.
    const result = router.routePower(mockGraph, 'Plant', 'City', 4, 20);

    expect(result.status).toBe('success');
    // Because the direct line approaches 99% capacity, its thermal resistance skyrockets exponentially.
    // The backup line, though physically longer, has virtually no thermal penalty.
    expect(result.path.includes('BackupSubstation')).toBe(true);
  });

  it('abandons safe capacity margins during an extreme ambient heatwave', () => {
    const router = new SmartGridRouter();

    const nodeA = { id: 'Plant' };
    const nodeB = { id: 'City' };
    const nodeC = { id: 'Detour' };

    // Under normal conditions (20C), this line at 80% load is perfectly fine.
    const normalEdge = { baseResistance: 1, currentLoad: 80, maxCapacity: 100 };
    
    // Empty backup edge that is much longer
    const backupEdge1 = { baseResistance: 2.5, currentLoad: 0, maxCapacity: 100 };
    const backupEdge2 = { baseResistance: 2.5, currentLoad: 0, maxCapacity: 100 };

    const mockGraph = {
      paths: [
        { name: 'Normal', nodes: [nodeA, nodeB], edges: [normalEdge] },
        { name: 'Backup', nodes: [nodeA, nodeC, nodeB], edges: [backupEdge1, backupEdge2] }
      ]
    };

    // Extreme heatwave: 45C
    const resultHeatwave = router.routePower(mockGraph, 'Plant', 'City', 5, 45);
    
    // Normal weather: 20C
    const resultNormal = router.routePower(mockGraph, 'Plant', 'City', 5, 20);

    // In normal weather, it should pick the normal direct line because 85% load isn't penalized enough to beat a base resistance of 5
    expect(resultNormal.path.includes('Detour')).toBe(false);
    
    // In extreme heat, the ambient temp multiplier causes the 85% loaded line to overheat, forcing the router to use the massive 5x longer backup route.
    expect(resultHeatwave.path.includes('Detour')).toBe(true);
  });

  it('refuses to route power if all paths will exceed physical thermal limits', () => {
    const router = new SmartGridRouter();

    const nodeA = { id: 'Plant' };
    const nodeB = { id: 'City' };

    // Line is at 98/100 MW
    const edge = { baseResistance: 1, currentLoad: 98, maxCapacity: 100 };

    const mockGraph = {
      paths: [
        { name: 'OnlyPath', nodes: [nodeA, nodeB], edges: [edge] }
      ]
    };

    // Requesting 5 MW. Total = 103 MW. Exceeds maxCapacity (100).
    const result = router.routePower(mockGraph, 'Plant', 'City', 5, 20);

    expect(result.status).toBe('grid_overload_prevented');
    expect(result.path.length).toBe(0);
  });
});
