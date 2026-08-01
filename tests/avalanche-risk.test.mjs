import { describe, it, expect } from 'vitest';
import { AvalancheRiskRouter } from '../lib/ai/avalanche-risk-router.js';

describe('AvalancheRiskRouter', () => {
  it('prefers safe low-angle terrain over 30-45 degree slopes', () => {
    const router = new AvalancheRiskRouter();

    // Start node
    const startNode = { id: 'Start', x: 0, y: 0, elevation: 1000 };
    // Prime avalanche terrain (35 degree slope)
    const steepNode = { id: 'AvalancheTerrain', x: 100, y: 0, elevation: 1070 };
    // Safe low-angle terrain (10 degree slope)
    const safeNode = { id: 'SafeTerrain', x: 0, y: 200, elevation: 1035 };
    // End node
    const endNode = { id: 'End', x: 100, y: 200, elevation: 1075 };

    const mockGraph = {
      paths: [
        { name: 'Direct Steep Path', nodes: [startNode, steepNode, endNode] },
        { name: 'Gentle Detour Path', nodes: [startNode, safeNode, endNode] }
      ]
    };

    // Even in LOW risk, a 30-45 degree slope has a 2.0x penalty
    const result = router.routeSkier(mockGraph, 'Start', 'End', { avalancheRiskLevel: 'LOW' });

    expect(result.status).toBe('success');
    expect(result.path.includes('SafeTerrain')).toBe(true);
    expect(result.path.includes('AvalancheTerrain')).toBe(false);
  });

  it('avoids cornices and runout zones entirely during HIGH risk', () => {
    const router = new AvalancheRiskRouter();

    const startNode = { id: 'Start', x: 0, y: 0, elevation: 1000 };
    const corniceNode = { id: 'UnderCornice', x: 100, y: 0, elevation: 1010, isCornice: true };
    const runoutNode = { id: 'RunoutZone', x: 100, y: 100, elevation: 1000, isRunoutZone: true };
    const safeNode = { id: 'RidgeLine', x: 0, y: 100, elevation: 1050 };
    const endNode = { id: 'End', x: 200, y: 100, elevation: 1020 };

    const mockGraph = {
      paths: [
        { name: 'Cornice Path', nodes: [startNode, corniceNode, endNode] },
        { name: 'Runout Path', nodes: [startNode, runoutNode, endNode] },
        { name: 'Safe Ridge Path', nodes: [startNode, safeNode, endNode] }
      ]
    };

    const result = router.routeSkier(mockGraph, 'Start', 'End', { avalancheRiskLevel: 'HIGH' });

    expect(result.status).toBe('success');
    expect(result.path.includes('RidgeLine')).toBe(true);
    expect(result.path.includes('UnderCornice')).toBe(false);
    expect(result.path.includes('RunoutZone')).toBe(false);
  });

  it('avoids 30-45 degree slopes entirely during EXTREME risk', () => {
    const router = new AvalancheRiskRouter();

    const startNode = { id: 'Start', x: 0, y: 0, elevation: 1000 };
    // 35 degree slope
    const steepNode = { id: 'SteepTerrain', x: 100, y: 0, elevation: 1070 };
    const endNode = { id: 'End', x: 100, y: 100, elevation: 1080 };

    const mockGraph = {
      paths: [
        { name: 'Only Path', nodes: [startNode, steepNode, endNode] }
      ]
    };

    // Should return no safe path found because the only path goes through a 35deg slope during EXTREME risk
    const result = router.routeSkier(mockGraph, 'Start', 'End', { avalancheRiskLevel: 'EXTREME' });

    expect(result.status).toBe('no_safe_path_found');
    expect(result.cost).toBe(Infinity);
  });
});
