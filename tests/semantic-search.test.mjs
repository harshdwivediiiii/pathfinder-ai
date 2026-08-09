import { describe, it, expect } from 'vitest';
import { simulateVectorSearch } from '../app/(main)/semantic-search/_components/vector-algorithm.js';

describe('Vector Database Integration for Semantic Course Search', () => {
  it('matches natural language queries to relevant technical pathways using simulated embeddings', () => {
    
    // Query 1: Visual/Frontend intent
    const query1 = "how to make websites look pretty and good";
    const results1 = simulateVectorSearch(query1);
    
    // Should prioritize Frontend courses
    expect(results1.length).toBeGreaterThan(0);
    expect(results1[0].category).toBe('Frontend');
    expect(results1[0].similarityScore).toBeGreaterThan(0.7);
    
    // Query 2: DevOps intent
    const query2 = "put my server live on the internet and scale it";
    const results2 = simulateVectorSearch(query2);
    
    // Should prioritize DevOps
    expect(results2.length).toBeGreaterThan(0);
    expect(results2[0].category).toBe('DevOps');
    expect(results2[0].similarityScore).toBeGreaterThan(0.7);
    
    // Query 3: Exact title match (should still work and score high)
    const query3 = "Machine Learning with PyTorch";
    const results3 = simulateVectorSearch(query3);
    
    expect(results3[0].title).toBe("Machine Learning with PyTorch");
    expect(results3[0].similarityScore).toBeGreaterThan(0.75);
    
    // Query 4: Garbage (should return empty or low scores)
    const query4 = "asdf qwerty zxcv";
    const results4 = simulateVectorSearch(query4);
    
    expect(results4.length).toBe(0); // Cutoff threshold filters it
  });
});
