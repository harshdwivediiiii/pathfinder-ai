import { describe, it, expect } from 'vitest';
import { generateNavInstructions } from '../app/(main)/voice-assistant/_components/nlp-algorithm.js';

describe('Voice-Interactive Nav Assistant', () => {
  it('generates contextual landmarks when enabled', () => {
    
    // mapData where (0,0) has a landmark
    const mapData = [
      [{ landmark: "blue gas station" }, { landmark: null }],
      [{ landmark: null }, { landmark: null }]
    ];
    
    // Path moves from (0,0) -> (0,1) -> (1,1). This requires a turn at (0,1).
    // Wait, the landmark is at the turn node. Let's make the turn happen at (0,0).
    // Path: start at (1,0) going left to (0,0), then down to (0,1).
    const path = [
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 }
    ];
    
    // Use Contextual LLM
    const instructionsContextual = generateNavInstructions(path, mapData, true);
    
    // There should be a turn instruction at (0,0) referencing the landmark
    expect(instructionsContextual.length).toBe(2); // Turn instruction + arrive instruction
    expect(instructionsContextual[0].text).toContain("blue gas station");
    expect(instructionsContextual[0].type).toBe("left");
    
    // Use Metric (Standard)
    const instructionsMetric = generateNavInstructions(path, mapData, false);
    expect(instructionsMetric[0].text).toContain("meters");
    expect(instructionsMetric[0].text).not.toContain("blue gas station");
  });
});
