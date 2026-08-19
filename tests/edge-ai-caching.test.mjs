import { describe, it, expect } from 'vitest';
import { predictAndCacheNextSteps, evaluateOfflineQuiz } from '../app/(main)/edge-ai-caching/_components/edge-algorithm.js';

describe('Edge AI for Offline Pathway Caching', () => {
  it('predicts and caches the next 3 modules based on current progress', () => {
    // Current module is mod_2 ("CSS Grid")
    const cachedSteps = predictAndCacheNextSteps('mod_2');
    
    expect(cachedSteps.length).toBe(3);
    
    // Should fetch mod_3, mod_4, and mod_5
    expect(cachedSteps[0].id).toBe('mod_3');
    expect(cachedSteps[1].id).toBe('mod_4');
    expect(cachedSteps[2].id).toBe('mod_5');
  });
  
  it('gracefully handles the end of the pathway', () => {
    // Current module is mod_6
    const cachedSteps = predictAndCacheNextSteps('mod_6');
    
    // Only one module left (mod_7)
    expect(cachedSteps.length).toBe(1);
    expect(cachedSteps[0].id).toBe('mod_7');
  });
  
  it('evaluates quiz text locally using NLP keyword matching', () => {
    const expectedKeywords = ['display', 'grid', 'columns', 'rows'];
    
    // Test a good answer
    const goodAnswer = "You use display: grid and then define your columns.";
    const goodResult = evaluateOfflineQuiz(goodAnswer, expectedKeywords);
    
    // 'display', 'grid', 'columns' = 3/4 = 75% -> Correct!
    expect(goodResult.isCorrect).toBe(true);
    expect(goodResult.score).toBe(75);
    
    // Test a bad answer
    const badAnswer = "I think you use flexbox maybe?";
    const badResult = evaluateOfflineQuiz(badAnswer, expectedKeywords);
    
    // 0/4 = 0% -> Incorrect
    expect(badResult.isCorrect).toBe(false);
    expect(badResult.score).toBe(0);
    expect(badResult.feedback).toContain('display');
  });
});
