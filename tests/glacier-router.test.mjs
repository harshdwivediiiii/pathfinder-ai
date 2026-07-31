import { describe, it, expect } from 'vitest';
import { GlacierRouter } from '../lib/ai/glacier-router.js';

describe('GlacierRouter', () => {
  it('avoids visually clear direct paths if GPR flags a hidden sub-surface crevasse', () => {
    const router = new GlacierRouter();

    const startNode = { id: 'Camp', x: 0, y: 0 };
    
    // Direct path node, visually looks perfect (no SAR sag), but GPR shows a massive void
    const hiddenCrevasse = { id: 'HiddenCrevasse', x: 100, y: 0 };
    
    // Safe detour
    const safeIce = { id: 'SafeIce', x: 0, y: 100 };
    const endNode = { id: 'Destination', x: 100, y: 100 };

    const mockGraph = {
      paths: [
        { name: 'Direct Line', nodes: [startNode, hiddenCrevasse, endNode] },
        { name: 'Detour', nodes: [startNode, safeIce, endNode] }
      ]
    };

    const sensorData = {
      gpr: {
        'HiddenCrevasse': { voidDepth: 20 } // Huge void right under the surface
      },
      sar: {}
    };

    const result = router.routeExpedition(mockGraph, 'Camp', 'Destination', sensorData);

    expect(result.status).toBe('success');
    expect(result.path.includes('SafeIce')).toBe(true);
    expect(result.path.includes('HiddenCrevasse')).toBe(false);
  });

  it('detours around SAR-flagged unstable snow bridges to find solid ice', () => {
    const router = new GlacierRouter();

    const startNode = { id: 'Camp', x: 0, y: 0 };
    
    // A snow bridge exists (GPR void + SAR sag) but it is dangerously thin (2m)
    const dangerousBridge = { id: 'DangerousBridge', x: 100, y: 0 };
    
    // Solid bedrock
    const bedrock = { id: 'Bedrock', x: 0, y: 100 };
    const endNode = { id: 'Destination', x: 100, y: 100 };

    const mockGraph = {
      paths: [
        { name: 'Bridge Crossing', nodes: [startNode, dangerousBridge, endNode] },
        { name: 'Bedrock Detour', nodes: [startNode, bedrock, endNode] }
      ]
    };

    const sensorData = {
      gpr: {
        'DangerousBridge': { voidDepth: 10, bridgeThickness: 2 } 
      },
      sar: {
        'DangerousBridge': { surfaceTensionAnomaly: true }
      }
    };

    const result = router.routeExpedition(mockGraph, 'Camp', 'Destination', sensorData);

    expect(result.status).toBe('success');
    expect(result.path.includes('Bedrock')).toBe(true);
    expect(result.path.includes('DangerousBridge')).toBe(false);
  });

  it('allows crossing a thick, certified snow bridge if necessary', () => {
    const router = new GlacierRouter();

    const startNode = { id: 'Camp', x: 0, y: 0 };
    
    // Snow bridge is 15m thick, easily holds vehicles
    const solidBridge = { id: 'SolidBridge', x: 100, y: 0 };
    const endNode = { id: 'Destination', x: 200, y: 0 };

    const mockGraph = {
      paths: [
        { name: 'Bridge Crossing', nodes: [startNode, solidBridge, endNode] }
      ]
    };

    const sensorData = {
      gpr: {
        'SolidBridge': { voidDepth: 30, bridgeThickness: 15 } 
      },
      sar: {
        'SolidBridge': { surfaceTensionAnomaly: true }
      }
    };

    const result = router.routeExpedition(mockGraph, 'Camp', 'Destination', sensorData);

    expect(result.status).toBe('success');
    expect(result.path.includes('SolidBridge')).toBe(true);
  });
});
