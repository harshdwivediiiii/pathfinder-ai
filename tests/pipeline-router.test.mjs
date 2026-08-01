import { describe, it, expect } from 'vitest';
import { PipelineRouter } from '../lib/ai/pipeline-router.js';

describe('PipelineRouter', () => {
  it('avoids a short path if the pipe diameter is too narrow for the robot', () => {
    // Robot diameter: 15cm, Max Swim: 2.0 m/s
    const router = new PipelineRouter(15, 2.0);

    const startNode = { id: 'InsertionPort', x: 0, y: 0 };
    const leakNode = { id: 'LeakNode', x: 100, y: 0 }; 

    // Path 1: Direct but narrow pipe (10cm diameter - robot will get stuck)
    const directNarrowEdge = { lengthMeters: 50, diameter: 10, valveState: 'OPEN', flowVelocity: 0 };
    
    // Path 2: Detour through wider main pipe (30cm diameter)
    const detourWideEdge = { lengthMeters: 200, diameter: 30, valveState: 'OPEN', flowVelocity: 0 };

    const mockGraph = {
      paths: [
        { name: 'Narrow Pipe', nodes: [startNode, leakNode], edges: [directNarrowEdge] },
        { name: 'Wide Detour', nodes: [startNode, { id: 'Junction' }, leakNode], edges: [detourWideEdge, detourWideEdge] }
      ]
    };

    const result = router.routeRobot(mockGraph, 'InsertionPort', 'LeakNode');

    expect(result.status).toBe('success');
    expect(result.path.includes('Junction')).toBe(true);
  });

  it('avoids a path with a CLOSED valve', () => {
    const router = new PipelineRouter(10, 2.0);

    const startNode = { id: 'Port', x: 0, y: 0 };
    const leakNode = { id: 'Leak', x: 100, y: 0 }; 

    const closedEdge = { lengthMeters: 50, diameter: 20, valveState: 'CLOSED', flowVelocity: 0 };
    const openEdge = { lengthMeters: 100, diameter: 20, valveState: 'OPEN', flowVelocity: 0 };

    const mockGraph = {
      paths: [
        { name: 'Closed Valve', nodes: [startNode, leakNode], edges: [closedEdge] },
        { name: 'Open Detour', nodes: [startNode, { id: 'Bypass' }, leakNode], edges: [openEdge, openEdge] }
      ]
    };

    const result = router.routeRobot(mockGraph, 'Port', 'Leak');

    expect(result.status).toBe('success');
    expect(result.path.includes('Bypass')).toBe(true);
  });

  it('favors a longer path with a tail-current over a shorter path fighting a massive head-current', () => {
    const router = new PipelineRouter(10, 2.0);

    const startNode = { id: 'Start', x: 0, y: 0 };
    const endNode = { id: 'End', x: 100, y: 0 }; 

    // Path 1: Short distance (50m) but fighting a strong head-current (-1.5 m/s)
    // Cost = 50 * (1 + (1.5 * 2)) = 50 * 4 = 200
    const headCurrentEdge = { lengthMeters: 50, diameter: 20, valveState: 'OPEN', flowVelocity: -1.5 };
    
    // Path 2: Longer distance (150m) but riding a strong tail-current (+1.0 m/s)
    // Cost = 150 / (1 + 1.0) = 150 / 2 = 75
    const tailCurrentEdge = { lengthMeters: 150, diameter: 20, valveState: 'OPEN', flowVelocity: 1.0 };

    const mockGraph = {
      paths: [
        { name: 'Head Current', nodes: [startNode, endNode], edges: [headCurrentEdge] },
        { name: 'Tail Current', nodes: [startNode, { id: 'Detour' }, endNode], edges: [tailCurrentEdge, tailCurrentEdge] }
      ]
    };

    const result = router.routeRobot(mockGraph, 'Start', 'End');

    expect(result.status).toBe('success');
    expect(result.path.includes('Detour')).toBe(true);
  });

  it('aborts routing entirely if the only path has an insurmountable current', () => {
    const router = new PipelineRouter(10, 2.0); // Max swim is 2.0

    const startNode = { id: 'Start', x: 0, y: 0 };
    const endNode = { id: 'End', x: 100, y: 0 }; 

    // Fluid is rushing against the robot at -3.0 m/s. Robot physically cannot swim against this.
    const fatalCurrentEdge = { lengthMeters: 50, diameter: 20, valveState: 'OPEN', flowVelocity: -3.0 };

    const mockGraph = {
      paths: [
        { name: 'Fatal Current', nodes: [startNode, endNode], edges: [fatalCurrentEdge] }
      ]
    };

    const result = router.routeRobot(mockGraph, 'Start', 'End');

    expect(result.status).toBe('no_route');
  });
});
