import { describe, it, expect, beforeEach } from 'vitest';
import { HyperloopRouter } from '../lib/ai/hyperloop-router.js';

describe('HyperloopRouter', () => {
  let router;
  
  beforeEach(() => {
    // 700 mph, 500ms safety buffer
    router = new HyperloopRouter(700, 500); 
  });

  it('translates physical distance into exact millisecond transit times', () => {
    // At 700 mph, 1 mile is traversed in ~5142 ms
    // (700 mph = 0.19444... miles/sec = 0.00019444... miles/ms)
    // 1 / 0.00019444 = 5142.85 -> Math.round -> 5143 ms
    const timeMs = router.calculateTransitTimeMs(1);
    expect(timeMs).toBe(5143);
  });

  it('delays departure to prevent a mid-transit collision at a junction', () => {
    const nodeA = { id: 'StationA', x: 0, y: 0 };
    const nodeB = { id: 'Junction', x: 0, y: 0 }; // Positions don't matter, using lengthMiles
    const nodeC = { id: 'StationC', x: 0, y: 0 };

    const mockGraph = {
      paths: [
        { nodes: [nodeA, nodeB, nodeC], edges: [{ lengthMiles: 1 }, { lengthMiles: 1 }] }
      ]
    };

    // Pod 1 requests departure at exactly 0ms.
    const result1 = router.schedulePodDeparture(mockGraph, 'StationA', 'StationC', 0, 'Pod1');
    expect(result1.status).toBe('scheduled');
    expect(result1.departureTimeMs).toBe(0);
    
    // Pod 1 will arrive at Junction at exactly 5143ms.
    expect(result1.plan[1].nodeId).toBe('Junction');
    expect(result1.plan[1].arrivalTimeMs).toBe(5143);

    // Pod 2 requests departure at exactly 100ms. 
    // If it departs at 100ms, it arrives at Junction at 5243ms.
    // 5243ms is within the 500ms safety buffer of Pod 1 (5143ms), which is a FATAL collision!
    // So Pod 2 MUST be delayed at the station until it can arrive at Junction at >= 5643ms.
    // That means departure time must be >= 500ms. (5143 + 500 - 5143 = 500)
    
    const result2 = router.schedulePodDeparture(mockGraph, 'StationA', 'StationC', 100, 'Pod2');
    expect(result2.status).toBe('scheduled');
    
    // Because they use the exact same track starting at StationA, the conflict actually 
    // happens at StationA first!
    // Pod 1 is at StationA at 0. Pod 2 cannot be at StationA until 500ms.
    expect(result2.departureTimeMs).toBe(500);

    // Let's verify Junction time
    expect(result2.plan[1].nodeId).toBe('Junction');
    expect(result2.plan[1].arrivalTimeMs).toBe(5143 + 500); // 5643
  });

  it('interleaves pods from different origins into a single track without deceleration', () => {
    // StationA ---1mi---> Junction ---1mi---> StationC
    // StationB ---2mi---> Junction 
    // Pod 1 leaves Station B at 0ms. 
    // It takes 2mi * 5143ms = 10286ms to hit Junction.
    
    // Pod 2 leaves Station A at 5000ms. 
    // It takes 1mi * 5143ms = 5143ms to hit Junction.
    // It would hit Junction at 10143ms.
    // 10286 - 10143 = 143ms apart. Collision! Safety buffer is 500ms.
    
    // Pod 2 must be delayed at Station A. 
    // It needs to hit Junction at 10286 + 500 = 10786ms.
    // 10786 - 5143 = 5643ms departure.

    const nodeA = { id: 'StationA', x:0, y:0 };
    const nodeB = { id: 'StationB', x:0, y:0 };
    const nodeJ = { id: 'Junction', x:0, y:0 };
    const nodeC = { id: 'StationC', x:0, y:0 };

    const graph = {
      paths: [
        { nodes: [nodeB, nodeJ, nodeC], edges: [{ lengthMiles: 2 }, { lengthMiles: 1 }] },
        { nodes: [nodeA, nodeJ, nodeC], edges: [{ lengthMiles: 1 }, { lengthMiles: 1 }] }
      ]
    };

    const res1 = router.schedulePodDeparture(graph, 'StationB', 'StationC', 0, 'Pod1');
    expect(res1.status).toBe('scheduled');
    expect(res1.departureTimeMs).toBe(0);

    const res2 = router.schedulePodDeparture(graph, 'StationA', 'StationC', 5000, 'Pod2');
    expect(res2.status).toBe('scheduled');
    expect(res2.departureTimeMs).toBe(5643); // Mathematically delayed at origin
  });
});
