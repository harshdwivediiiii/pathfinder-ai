import { describe, it, expect } from 'vitest';
import { QuantumRouter } from '../lib/ai/quantum-router.js';

describe('QuantumRouter', () => {
  it('correctly formulates a 3-node TSP into a 9-variable QUBO matrix', () => {
    const router = new QuantumRouter(10000);
    
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const distances = {
      'A': { 'B': 10, 'C': 20 },
      'B': { 'A': 10, 'C': 15 },
      'C': { 'A': 20, 'B': 15 }
    };

    const qubo = router.generateQuboMatrix(nodes, distances);

    // 3 nodes * 3 steps = 9 binary variables
    expect(qubo.numVariables).toBe(9);
    
    // Matrix should be 9x9
    expect(qubo.matrix.length).toBe(9);
    expect(qubo.matrix[0].length).toBe(9);

    // Check penalty enforcement on a diagonal (should be heavily negative)
    // -P for each of the 2 constraints = -20000
    expect(qubo.matrix[0][0]).toBeLessThan(-1000); 
    
    // Check quadratic penalty (should be +2P)
    // Node 0 at step 0, and Node 0 at step 1 cannot both be true.
    expect(qubo.matrix[0][1]).toBeGreaterThan(1000);
  });

  it('decodes a valid simulated quantum binary result into a classical path', () => {
    const router = new QuantumRouter();
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    
    // Valid binary string for A -> C -> B
    // Step 0: A (var index 0)
    // Step 1: C (var index 7)
    // Step 2: B (var index 5)
    // Index map:
    // i=0(A): 0, 1, 2
    // i=1(B): 3, 4, 5
    // i=2(C): 6, 7, 8
    
    // We want '1' at indices 0, 7, 5. All others '0'.
    // 012 345 678
    // 100 001 010
    const mockResult = '100001010';

    const decoded = router.decodeQuantumResult(mockResult, nodes);
    
    expect(decoded.status).toBe('success');
    expect(decoded.path).toEqual(['A', 'C', 'B']);
  });

  it('returns an error if the quantum solver violates constraints (invalid string)', () => {
    const router = new QuantumRouter();
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    
    // Invalid binary string: Node A is visited at step 0 AND step 1 (0, 1)
    const mockInvalidResult = '110001010';

    const decoded = router.decodeQuantumResult(mockInvalidResult, nodes);
    
    expect(decoded.status).toBe('error');
    expect(decoded.reason).toContain('Invalid QUBO solution');
  });
});
