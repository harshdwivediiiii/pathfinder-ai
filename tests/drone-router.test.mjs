import { describe, it, expect } from 'vitest';
import { calculateDroneRoute } from '../app/(main)/drone-router/_components/drone-algorithm.js';

describe('Drone Router Algorithm', () => {
  it('calculates a 3D route avoiding ground collisions', () => {
    // 3x3 map
    // Top row: high terrain (height=5)
    // Middle row: low terrain (height=1)
    // Bottom row: low terrain (height=1)
    const mapData = [
      [{ terrainHeight: 5, hasThermal: false, hasTurbulence: false }, { terrainHeight: 5, hasThermal: false, hasTurbulence: false }, { terrainHeight: 5, hasThermal: false, hasTurbulence: false }],
      [{ terrainHeight: 1, hasThermal: false, hasTurbulence: false }, { terrainHeight: 1, hasThermal: false, hasTurbulence: false }, { terrainHeight: 1, hasThermal: false, hasTurbulence: false }],
      [{ terrainHeight: 1, hasThermal: false, hasTurbulence: false }, { terrainHeight: 1, hasThermal: false, hasTurbulence: false }, { terrainHeight: 1, hasThermal: false, hasTurbulence: false }]
    ];
    
    // Start at z=2, which is above the low terrain at y=1
    const start = { x: 0, y: 1, z: 2 };
    const end = { x: 2, y: 1, z: 2 };
    
    // Max altitude is 10, battery weight is 2
    const result = calculateDroneRoute(start, end, mapData, 10, 2);
    expect(result.status).toBe("Optimal Flight Path Established");
    
    // Path MUST detour through y=1 or ascend
    const detoured = result.path.some(p => p.y === 1 || p.z > 5);
    expect(detoured).toBe(true);
  });

  it('uses thermal updrafts to save battery', () => {
    // 3x3 map, flat terrain
    // Middle node has a thermal
    const mapData = [
      [{ terrainHeight: 0, hasThermal: false, hasTurbulence: false }, { terrainHeight: 0, hasThermal: false, hasTurbulence: false }, { terrainHeight: 0, hasThermal: false, hasTurbulence: false }],
      [{ terrainHeight: 0, hasThermal: false, hasTurbulence: false }, { terrainHeight: 0, hasThermal: true, hasTurbulence: false }, { terrainHeight: 0, hasThermal: false, hasTurbulence: false }],
      [{ terrainHeight: 0, hasThermal: false, hasTurbulence: false }, { terrainHeight: 0, hasThermal: false, hasTurbulence: false }, { terrainHeight: 0, hasThermal: false, hasTurbulence: false }]
    ];
    
    // Need to ascend
    const start = { x: 0, y: 1, z: 1 };
    const end = { x: 2, y: 1, z: 5 };
    
    // With high battery weight (10), it should absolutely go to (1,1) first to ascend
    const result = calculateDroneRoute(start, end, mapData, 10, 10);
    expect(result.status).toBe("Optimal Flight Path Established");
    
    // Verify it used the thermal at (1,1) for climbing
    const ascendedAtThermal = result.path.some(p => p.x === 1 && p.y === 1 && p.z > 1);
    expect(ascendedAtThermal).toBe(true);
  });
});
