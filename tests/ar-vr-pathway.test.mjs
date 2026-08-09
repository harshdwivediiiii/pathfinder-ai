import { describe, it, expect } from 'vitest';
import { calculateSpatialCoordinates } from '../app/(main)/ar-vr-pathway/_components/webxr-algorithm.js';

describe('AR/VR Immersive Pathway Visualization', () => {
  it('calculates 3D spatial coordinates based on graph depth, branches, and node types', () => {
    
    const mockGraph = [
        { id: 'n1', label: 'HTML', type: 'core', depthLevel: 0, branchId: 0 },
        { id: 'n2', label: 'JS', type: 'core', depthLevel: 1, branchId: 0 },
        { id: 'n3', label: 'React', type: 'specialization', depthLevel: 2, branchId: -1 },
        { id: 'n4', label: 'Docker', type: 'advanced', depthLevel: 3, branchId: 1 }
    ];
    
    const spatialData = calculateSpatialCoordinates(mockGraph);
    
    expect(spatialData.length).toBe(4);
    
    // Core Node at depth 0
    expect(spatialData[0].coordinates.x).toBe(0);
    expect(spatialData[0].coordinates.y).toBe(0);
    expect(spatialData[0].coordinates.z).toBe(0);
    
    // Core Node at depth 1 (Should be deeper in Z, but X and Y are 0)
    expect(spatialData[1].coordinates.x).toBe(0);
    expect(spatialData[1].coordinates.y).toBe(0);
    expect(spatialData[1].coordinates.z).toBeLessThan(0); // Z goes negative into screen
    
    // Specialization Node at depth 2 (Should branch left on X, and go up on Y)
    expect(spatialData[2].coordinates.x).toBeLessThan(0); // branchId -1
    expect(spatialData[2].coordinates.y).toBeGreaterThan(0); // Specialization goes up
    expect(spatialData[2].coordinates.z).toBeLessThan(spatialData[1].coordinates.z); // Deeper than node 2
    
    // Advanced Node at depth 3 (Should branch right on X, and go higher on Y)
    expect(spatialData[3].coordinates.x).toBeGreaterThan(0); // branchId 1
    expect(spatialData[3].coordinates.y).toBeGreaterThan(spatialData[2].coordinates.y); // Advanced goes higher than specialization
    
  });
});
