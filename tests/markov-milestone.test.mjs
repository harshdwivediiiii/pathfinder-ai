import { describe, it, expect } from 'vitest';
import { simulateMarkovMilestone } from '../app/(main)/markov-milestone/_components/markov-algorithm.js';

describe('Gamified Milestone Prediction using Markov Chains', () => {
  it('predicts a timeline realistically based on moderate consistency', () => {
    const stats = {
      consistencyScore: 75,
      churnRiskScore: 30,
      averageModulesPerWeek: 2
    };
    
    // 20 modules / 2 per week = 10 weeks linear. 
    // Markov should predict >= 10 weeks because of human friction.
    const result = simulateMarkovMilestone(stats, 20);
    
    expect(result.expectedWeeks).toBeGreaterThanOrEqual(10);
    expect(result.confidencePercentage).toBeGreaterThan(50);
    expect(result.projectedDate).toBeDefined();
    expect(result.message).toContain('chance to reach your milestone');
  });
  
  it('returns a much longer expected timeline for low consistency / high churn risk', () => {
    const poorStats = {
      consistencyScore: 20, // Low consistency
      churnRiskScore: 80,   // High churn
      averageModulesPerWeek: 2
    };
    
    const result = simulateMarkovMilestone(poorStats, 20);
    
    // Linear is 10 weeks, but this user gets stuck/inactive often.
    expect(result.expectedWeeks).toBeGreaterThan(12); // Should definitely be longer than linear
    expect(result.confidencePercentage).toBeLessThan(60); // Low confidence
  });
  
  it('handles invalid inputs gracefully', () => {
    expect(simulateMarkovMilestone(null, 10).error).toBeDefined();
    expect(simulateMarkovMilestone({}, -5).error).toBeDefined();
    expect(simulateMarkovMilestone({}, 0).error).toBeDefined();
  });
});
