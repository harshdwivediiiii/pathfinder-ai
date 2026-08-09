import { describe, it, expect } from 'vitest';
import { calculateMasteryBKT, prunePathway } from '../app/(main)/adaptive-learning-pacing/_components/bkt-algorithm.js';

describe('AI-Driven Adaptive Learning Pacing (BKT)', () => {
  const defaultPathway = [
    { id: "mod_1", isBeginner: true },
    { id: "mod_2", isBeginner: true },
    { id: "mod_3", isBeginner: false },
  ];

  it('calculates a high mastery probability for a user with perfect quiz scores', () => {
    // Prior: 0.5. Perfect score array.
    const results = [true, true, true, true];
    const bkt = calculateMasteryBKT(0.5, 0.1, 0.2, 0.1, results);
    
    // Probability should naturally rise towards 1.0
    expect(bkt.masteryProbability).toBeGreaterThan(0.85);
  });
  
  it('prunes beginner modules if mastery probability is above threshold', () => {
    const optimized = prunePathway(0.95, 0.85, defaultPathway);
    
    expect(optimized.action).toBe('accelerate');
    // It should remove mod_1 and mod_2
    expect(optimized.newPathway.length).toBe(1);
    expect(optimized.newPathway[0].id).toBe('mod_3');
  });
  
  it('calculates a low mastery probability for a user with poor quiz scores', () => {
    const results = [false, false, true, false];
    const bkt = calculateMasteryBKT(0.5, 0.1, 0.2, 0.1, results);
    
    // Probability should drop heavily
    expect(bkt.masteryProbability).toBeLessThan(0.5);
  });
  
  it('maintains the full original pathway if mastery is below threshold', () => {
    const optimized = prunePathway(0.40, 0.85, defaultPathway);
    
    expect(optimized.action).toBe('maintain');
    // Should keep all 3 modules
    expect(optimized.newPathway.length).toBe(3);
    expect(optimized.newPathway[0].isBeginner).toBe(true);
  });
});
