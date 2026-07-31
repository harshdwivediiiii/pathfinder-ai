import { describe, it, expect } from 'vitest';
import { HFTRouter } from '../lib/ai/hft-router.js';

describe('HFTRouter', () => {
  it('chooses a physically longer microwave route over a shorter fiber route due to refractive index', () => {
    const router = new HFTRouter();

    const startNode = { id: 'Chicago', x: 0, y: 0 };
    const endNode = { id: 'NewYork', x: 1000000, y: 0 }; // 1000km straight line

    // Fiber path is slightly curved/longer physically, say 1100km
    const fiberEdge = { medium: 'fiber', hardwareDelayMicroseconds: 0, lengthMeters: 1100000 };
    // Microwave path is line-of-sight, say 1050km
    const microwaveEdge = { medium: 'air', hardwareDelayMicroseconds: 0, lengthMeters: 1050000 };

    // Let's calculate manual latency to verify expectation:
    // v_fiber = c / 1.4682 = 204,190,476 m/s -> 1,100,000 / v_fiber = 5.387 milliseconds = 5387 us
    // v_air = c / 1.0003 = 299,702,547 m/s -> 1,050,000 / v_air = 3.503 milliseconds = 3503 us

    const mockGraph = {
      paths: [
        { name: 'Fiber Path', nodes: [startNode, endNode], edges: [fiberEdge] },
        { name: 'Microwave Path', nodes: [startNode, endNode], edges: [microwaveEdge] }
      ]
    };

    const result = router.routeData(mockGraph, 'Chicago', 'NewYork');

    expect(result.status).toBe('success');
    expect(result.path).toEqual(['Chicago', 'NewYork']);
    
    // It should pick the microwave path which has much lower latency (~3503us vs ~5387us)
    // Let's just assert the latency is around 3503
    expect(result.latency).toBeLessThan(4000); 
  });

  it('avoids a direct microwave route if it has excessive hardware switching delays', () => {
    const router = new HFTRouter();

    const startNode = { id: 'London', x: 0, y: 0 };
    const endNode = { id: 'Frankfurt', x: 600000, y: 0 }; // 600km

    // Fast fiber path (600km length, direct line) with state-of-the-art optical switches (10us delay)
    const fiberEdge = { medium: 'fiber', hardwareDelayMicroseconds: 10, lengthMeters: 600000 };
    // Microwave path (600km) but goes through an old electronic repeater adding 2000us delay
    const microwaveEdge = { medium: 'air', hardwareDelayMicroseconds: 2000, lengthMeters: 600000 };

    // v_fiber -> 600,000 / 204190476 = 2938 us + 10 us = 2948 us
    // v_air -> 600,000 / 299702547 = 2002 us + 2000 us = 4002 us

    const mockGraph = {
      paths: [
        { name: 'Fiber Path', nodes: [startNode, endNode], edges: [fiberEdge] },
        { name: 'Microwave Path', nodes: [startNode, endNode], edges: [microwaveEdge] }
      ]
    };

    const result = router.routeData(mockGraph, 'London', 'Frankfurt');

    expect(result.status).toBe('success');
    // Fiber is faster because of hardware delays on the microwave link
    expect(Math.round(result.latency)).toBe(2948);
  });
});
