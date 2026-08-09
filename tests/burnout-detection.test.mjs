import { describe, it, expect } from 'vitest';
import { generateTelemetry, predictBurnout } from '../app/(main)/burnout-detection/_components/lstm-algorithm.js';

describe('Predictive Burnout Detection', () => {
  it('identifies healthy sustainable behavior', () => {
    // Generate healthy mock data
    const healthyData = generateTelemetry('healthy');
    const prediction = predictBurnout(healthyData);
    
    // Should have low risk score and no intervention
    expect(prediction.riskScore).toBeLessThan(50);
    expect(prediction.interventionRequired).toBe(false);
    expect(prediction.factors.length).toBeLessThan(2);
  });
  
  it('detects high-risk burnout patterns (cramming followed by drop-off)', () => {
    // Generate burning out mock data
    const burnoutData = generateTelemetry('burning_out');
    const prediction = predictBurnout(burnoutData);
    
    // Should have high risk score and require intervention
    expect(prediction.riskScore).toBeGreaterThan(70);
    expect(prediction.interventionRequired).toBe(true);
    
    // Should correctly identify the risk factors
    const factorText = prediction.factors.join(' ');
    expect(factorText.toLowerCase()).toContain('drop-off');
    expect(factorText.toLowerCase()).toContain('decline');
  });
});
