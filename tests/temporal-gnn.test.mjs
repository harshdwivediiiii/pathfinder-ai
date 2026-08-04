import { describe, it, expect } from 'vitest';
import { generateTemporalMap, getSamplePath, calculateETAs } from '../app/(main)/temporal-gnn/_components/gnn-algorithm.js';

describe('Temporal Graph Neural Networks ETA', () => {
  it('diverges significantly from heuristic during rush hour peak', () => {
    
    const map = generateTemporalMap(20, 20, 42);
    // Path uses an arterial (x=10, y changes)
    const path = getSamplePath(10, 0, 10, 19);
    
    // Test Off-Peak (12:00 PM)
    const offPeak = calculateETAs(path, map, 12.0);
    // During off peak, heuristic uses 1.0 multiplier, TGNN uses 1.0 multiplier
    expect(offPeak.heuristicETA).toBe(offPeak.tgnnETA);
    
    // Test Rush Hour Peak (17.5 = 5:30 PM)
    const peak = calculateETAs(path, map, 17.5);
    
    // Heuristic applies a flat 1.4 multiplier during peak.
    // TGNN applies a 3.0 multiplier (1.0 + 2.0 * severity) for arterials at absolute peak.
    // So TGNN should be significantly higher.
    expect(peak.tgnnETA).toBeGreaterThan(peak.heuristicETA * 1.5);
  });
});
