import { describe, it, expect } from 'vitest';
import { AcousticStealthRouter } from '../lib/ai/acoustic-stealth-router.js';

describe('AcousticStealthRouter', () => {
  it('prefers routing below the thermocline to avoid surface sensors', () => {
    const router = new AcousticStealthRouter();

    // Surface sensor array with 10km range
    const sensors = [
      { id: 'SurfaceBuoy', x: 5000, y: 5000, depth: 10, maxRange: 10000 }
    ];

    const environment = { thermoclineDepth: 50 }; // Thermocline is at 50m

    const startNode = { id: 'Start', x: 0, y: 5000, depth: 30 };
    
    // Path 1: Stays shallow (above thermocline), high detection risk
    const shallowNode = { id: 'ShallowPath', x: 5000, y: 5000, depth: 30 };
    
    // Path 2: Dives below thermocline, enters acoustic shadow zone
    const deepNode = { id: 'DeepPath', x: 5000, y: 5000, depth: 100 };
    
    const endNode = { id: 'End', x: 10000, y: 5000, depth: 50 };

    const mockGraph = {
      paths: [
        { name: 'Shallow Direct', nodes: [startNode, shallowNode, endNode] },
        { name: 'Deep Stealth', nodes: [startNode, deepNode, endNode] }
      ]
    };

    const result = router.routeVessel(mockGraph, 'Start', 'End', sensors, environment);

    expect(result.status).toBe('success');
    expect(result.path.includes('DeepPath')).toBe(true);
    expect(result.path.includes('ShallowPath')).toBe(false);
  });

  it('avoids the Deep Sound Channel if a long-range SOSUS array is present there', () => {
    const router = new AcousticStealthRouter();

    // SOSUS array deep in the SOFAR channel
    const sensors = [
      { id: 'SOSUS', x: 5000, y: 5000, depth: 1000, maxRange: 15000 }
    ];

    const environment = { sofarMinDepth: 800, sofarMaxDepth: 1200 };

    const startNode = { id: 'Start', x: 0, y: 5000, depth: 500 };
    
    // Path 1: Enters SOFAR channel, extreme detection risk due to trapped sound
    const sofarNode = { id: 'SofarPath', x: 5000, y: 5000, depth: 1000 };
    
    // Path 2: Stays above SOFAR channel, moderate detection risk but much safer
    const midDepthNode = { id: 'MidDepthPath', x: 5000, y: 5000, depth: 600 };
    
    const endNode = { id: 'End', x: 10000, y: 5000, depth: 500 };

    const mockGraph = {
      paths: [
        { name: 'SOFAR Path', nodes: [startNode, sofarNode, endNode] },
        { name: 'Mid Depth Path', nodes: [startNode, midDepthNode, endNode] }
      ]
    };

    const result = router.routeVessel(mockGraph, 'Start', 'End', sensors, environment);

    expect(result.status).toBe('success');
    expect(result.path.includes('MidDepthPath')).toBe(true);
    expect(result.path.includes('SofarPath')).toBe(false);
  });
});
