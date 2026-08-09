import { describe, it, expect } from 'vitest';
import { getBasePathways, simulateMarketScrape, calculateDynamicScores } from '../app/(main)/job-market-trends/_components/trend-algorithm.js';

describe('Real-Time Job Market Trend Integration', () => {
  it('dynamically adjusts pathway scores based on simulated TF-IDF extraction', () => {
    
    const pathways = getBasePathways();
    
    // Test AI Boom condition
    const tfAIBoom = simulateMarketScrape('ai_boom');
    const updatedAIBoom = calculateDynamicScores(pathways, tfAIBoom);
    
    // AI Engineer base score is 60.
    // In AI boom, llm, openai, rag, python, langchain spike.
    const aiPathway = updatedAIBoom.find(p => p.id === 'ai');
    const dataPathway = updatedAIBoom.find(p => p.id === 'data');
    const frontendPathway = updatedAIBoom.find(p => p.id === 'frontend');
    
    // AI and Data should receive significant boosts
    expect(aiPathway.boost).toBeGreaterThan(10);
    expect(dataPathway.boost).toBeGreaterThan(0);
    
    // AI boost should be larger than frontend boost (which only gets baseline TF * IDF)
    expect(aiPathway.boost).toBeGreaterThan(frontendPathway.boost);
    
    // Test Cloud condition
    const tfCloud = simulateMarketScrape('cloud_migration');
    const updatedCloud = calculateDynamicScores(pathways, tfCloud);
    
    const devopsPathway = updatedCloud.find(p => p.id === 'devops');
    
    // DevOps should receive a significant boost
    expect(devopsPathway.boost).toBeGreaterThan(10);
    // DevOps boost should be larger than AI boost in this scenario
    const aiPathwayCloud = updatedCloud.find(p => p.id === 'ai');
    expect(devopsPathway.boost).toBeGreaterThan(aiPathwayCloud.boost);
  });
});
