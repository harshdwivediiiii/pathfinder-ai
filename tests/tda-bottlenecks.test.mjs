import { describe, it, expect, beforeEach } from 'vitest';
import { TopologicalAnalyzer } from '../app/(main)/tda-bottlenecks/_components/tda-algorithm.js';

describe('Topological Data Analysis for Learning Pathway Bottlenecks', () => {
    let tda;

    beforeEach(() => {
        tda = new TopologicalAnalyzer();
    });

    it('should throw error if fitting with invalid telemetry data', () => {
        expect(() => tda.fit(null)).toThrow("Invalid telemetry data");
        expect(() => tda.fit([])).toThrow("Invalid telemetry data");
    });

    it('should throw error if identifying bottlenecks before fitting', () => {
        expect(() => tda.identifyBottlenecks()).toThrow("Model must be fitted");
    });

    it('should identify structural bottlenecks and holes based on churn threshold', () => {
        const mockTelemetry = [{ id: 'test' }]; // We just need a non-empty array for the mock fit
        
        tda.fit(mockTelemetry);
        
        const results = tda.identifyBottlenecks(0.3); // 30% threshold

        // redux_saga (0.45) and webgl_shaders (0.60) should be bottlenecks
        expect(results.bottlenecks.length).toBe(2);
        expect(results.bottlenecks.map(b => b.id)).toContain('redux_saga');
        expect(results.bottlenecks.map(b => b.id)).toContain('webgl_shaders');

        // Betti-1 hole involving redux_saga should be found
        expect(results.structuralHoles.length).toBe(1);
        expect(results.structuralHoles[0].dimension).toBe(1);
        expect(results.structuralHoles[0].nodesInvolved).toContain('redux_saga');

        // Check Betti numbers
        expect(results.bettiNumbers.b0).toBe(6); // Total mock nodes is 6
        expect(results.bettiNumbers.b1).toBe(1); // 1 hole
    });
});
