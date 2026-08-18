import { describe, it, expect } from 'vitest';
import { generateKnowledgeGraph, calculateDynamicPathway } from '../app/(main)/knowledge-graph/_components/graph-algorithm.js';

describe('Dynamic Knowledge Graph Skill Dependencies', () => {
  it('reduces downstream learning time when prerequisites are completed', () => {
    
    const baseGraph = generateKnowledgeGraph();
    
    // Baseline calculation with no skills completed
    const baseline = calculateDynamicPathway(baseGraph, []);
    
    const baselineML = baseline.nodes.find(n => n.id === 'ml');
    expect(baselineML.adjustedTime).toBe(baselineML.baseTime);
    expect(baselineML.baseTime).toBe(30);
    
    // Now, complete prerequisites: calculus, stats, python
    const progressed = calculateDynamicPathway(baseGraph, ['calc', 'stats', 'python']);
    
    const progressedML = progressed.nodes.find(n => n.id === 'ml');
    
    // ML has 3 incoming edges (calc, stats, python). 
    // Each completed prereq should multiply the time by 0.85
    // 30 * 0.85 * 0.85 * 0.85 = 18.42375 => rounded to 18
    expect(progressedML.adjustedTime).toBe(18);
    expect(progressedML.adjustedTime).toBeLessThan(baselineML.adjustedTime);
    
    // Total remaining time should be significantly less than baseline remaining time
    expect(progressed.remainingTime).toBeLessThan(baseline.remainingTime);
  });
});
