import { describe, it, expect } from 'vitest';
import { generateMockQuestion, evaluateAnswer } from '../app/(main)/mock-interview/_components/interview-algorithm.js';

describe('Generative AI Mock Interview Simulator', () => {
  it('generates contextual questions based on the selected skill profile', () => {
    
    // Test React/Node profile
    const fullstackProfile = ['react', 'node'];
    const fullstackQ = generateMockQuestion(fullstackProfile);
    expect(fullstackQ.context).toBe('Fullstack React/Node');
    expect(fullstackQ.expectedKeywords.length).toBeGreaterThan(0);
    
    // Test Python/ML profile
    const mlProfile = ['python', 'ml'];
    const mlQ = generateMockQuestion(mlProfile);
    expect(mlQ.context).toBe('Machine Learning (Python)');
    expect(mlQ.expectedKeywords.includes('smote')).toBe(true);
  });
  
  it('evaluates answers and calculates a score based on expected keywords', () => {
    const expectedKeywords = ['useeffect', 'caching', 'redux'];
    
    // Empty answer
    const emptyEval = evaluateAnswer('', expectedKeywords);
    expect(emptyEval.score).toBe(0);
    
    // Poor answer (0 matches)
    const poorAnswer = "I just used normal react states.";
    const poorEval = evaluateAnswer(poorAnswer, expectedKeywords);
    expect(poorEval.score).toBe(0);
    expect(poorEval.matchedKeywords.length).toBe(0);
    
    // Good answer (2 out of 3 matches, > 50%)
    const goodAnswer = "I utilized the useEffect hook to fetch data and stored it globally using Redux.";
    const goodEval = evaluateAnswer(goodAnswer, expectedKeywords);
    expect(goodEval.score).toBeGreaterThan(50);
    expect(goodEval.matchedKeywords).toContain('useeffect');
    expect(goodEval.matchedKeywords).toContain('redux');
    expect(goodEval.matchedKeywords).not.toContain('caching');
  });
});
