import { describe, it, expect } from 'vitest';
import { WarehouseCBSRouter } from '../lib/ai/warehouse-cbs-router.js';

describe('WarehouseCBSRouter', () => {
  it('routes a single agent on a clear path', () => {
    const router = new WarehouseCBSRouter();
    
    // A-B-C-D corridor
    const graph = {
      edges: {
        'A': ['B'],
        'B': ['A', 'C'],
        'C': ['B', 'D'],
        'D': ['C']
      }
    };

    const agents = [
      { id: 'AGV1', startId: 'A', endId: 'D', startTime: 0 }
    ];

    const results = router.routeMultipleAgents(graph, agents);

    expect(results['AGV1'].status).toBe('success');
    expect(results['AGV1'].path.length).toBe(4); // A(0), B(1), C(2), D(3)
    expect(results['AGV1'].path[3].node).toBe('D');
    expect(results['AGV1'].path[3].time).toBe(3);
  });

  it('avoids intersection collision by forcing an agent to wait', () => {
    const router = new WarehouseCBSRouter();

    // Cross intersection:
    //   N
    // W-X-E
    //   S
    const graph = {
      edges: {
        'N': ['X'],
        'S': ['X'],
        'W': ['X'],
        'E': ['X'],
        'X': ['N', 'S', 'W', 'E']
      }
    };

    // Both agents want to cross X at time=1
    // AGV1: W -> X -> E
    // AGV2: N -> X -> S
    const agents = [
      { id: 'AGV1', startId: 'W', endId: 'E', startTime: 0, priority: 10 },
      { id: 'AGV2', startId: 'N', endId: 'S', startTime: 0, priority: 5 }
    ];

    const results = router.routeMultipleAgents(graph, agents);

    expect(results['AGV1'].status).toBe('success');
    expect(results['AGV2'].status).toBe('success');

    // AGV1 has higher priority, crosses X at time 1
    const agv1X = results['AGV1'].path.find(p => p.node === 'X');
    expect(agv1X.time).toBe(1);

    // AGV2 must wait at N or delay crossing, so it will reach X at time 2
    const agv2X = results['AGV2'].path.find(p => p.node === 'X');
    expect(agv2X.time).toBeGreaterThan(1);
    
    // Total time for AGV2 should be longer because of the wait
    const agv2End = results['AGV2'].path[results['AGV2'].path.length - 1];
    expect(agv2End.time).toBeGreaterThan(2); 
  });

  it('prevents edge collision (swapping places in a hallway)', () => {
    const router = new WarehouseCBSRouter();

    // Hallway: A-B
    const graph = {
      edges: {
        'A': ['B'],
        'B': ['A']
      }
    };

    // AGV1 wants to go A->B, AGV2 wants to go B->A at the same time
    const agents = [
      { id: 'AGV1', startId: 'A', endId: 'B', startTime: 0, priority: 10 },
      { id: 'AGV2', startId: 'B', endId: 'A', startTime: 0, priority: 5 }
    ];

    const results = router.routeMultipleAgents(graph, agents);

    // One agent will succeed (AGV1), but AGV2 will be trapped because B->A is blocked by A->B swapping,
    // and AGV1 will arrive at B at time 1. AGV2 waiting at B will be crushed at time 1.
    // In our algorithm, AGV2 cannot stay at B because AGV1 reserves B at time 1.
    // So AGV2 will fail to find a safe path.
    expect(results['AGV1'].status).toBe('success');
    expect(results['AGV2'].status).toBe('no_path_found');
  });
});
