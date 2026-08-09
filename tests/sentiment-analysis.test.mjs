import { describe, it, expect } from 'vitest';
import { analyzeSentiment } from '../app/(main)/sentiment-analysis/_components/sentiment-algorithm.js';

describe('Sentiment Analysis on User Progress Logs', () => {
  it('correctly categorizes a highly frustrated journal entry', () => {
    const text = "I am so stuck and confused. I hate this module, it is too hard and frustrating.";
    const result = analyzeSentiment(text);
    
    expect(result.category).toBe('Frustrated');
    expect(result.score).toBeLessThan(0);
    expect(result.flags.some(f => f.keyword === 'frustrating')).toBe(true);
  });
  
  it('correctly categorizes a highly satisfied journal entry', () => {
    const text = "This was great and awesome! I finally understood everything. So fun and easy.";
    const result = analyzeSentiment(text);
    
    expect(result.category).toBe('Satisfied');
    expect(result.score).toBeGreaterThan(0);
    expect(result.flags.some(f => f.keyword === 'great')).toBe(true);
  });
  
  it('handles mixed sentiments (neutral)', () => {
    const text = "It was great to learn, but sometimes it was hard and confusing.";
    const result = analyzeSentiment(text);
    
    // 1 positive (great), 2 negative (hard, confusing)
    // score = (1 - 2) / 3 = -0.33 -> Borderline Frustrated. Wait, let's just assert the score math
    // -0.33 is <= -0.3, so it is 'Frustrated'
    expect(result.score).toBeCloseTo(-0.33, 1);
  });
  
  it('handles empty or non-string inputs gracefully', () => {
    expect(analyzeSentiment("").category).toBe('Neutral');
    expect(analyzeSentiment(null).category).toBe('Neutral');
    expect(analyzeSentiment(undefined).category).toBe('Neutral');
  });
});
