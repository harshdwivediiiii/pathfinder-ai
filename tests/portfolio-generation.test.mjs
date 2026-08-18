import { describe, it, expect } from 'vitest';
import { generateAutomatedPortfolio } from '../app/(main)/portfolio-generation/_components/github-llm-algorithm.js';

describe('Automated Portfolio Generation from GitHub/GitLab', () => {
  it('fetches repos, filters trivial ones, and generates LLM summaries', () => {
    // johndoe123 has 4 repos in the mock.
    // 1 is "react-portfolio-v1" which has 0 stars and no trigger words, but we also filter by description length > 20. 
    // Wait, let's check the filter logic:
    // repo.stars > 0 OR repo.name.includes('capstone') OR repo.name.includes('microservices') OR repo.description.length > 20
    
    const result = generateAutomatedPortfolio('johndoe123');
    
    expect(result.username).toBe('johndoe123');
    expect(result.publicUrl).toContain('johndoe123');
    
    // It should have filtered out the trivial repo if it didn't meet criteria, but actually:
    // react-portfolio-v1: 0 stars, desc = "My first react app" (18 chars). So it should be filtered out!
    expect(result.projects.length).toBe(3); // 4 total - 1 trivial = 3
    
    // Check if the LLM summaries were generated
    const nodeProject = result.projects.find(p => p.language === 'Node.js');
    expect(nodeProject).toBeDefined();
    
    // The simulated LLM for Node should mention "scalable backend"
    expect(nodeProject.llmGeneratedReadme).toContain('scalable backend');
    expect(nodeProject.llmGeneratedReadme).toContain('Business Impact');
  });
  
  it('handles invalid users gracefully', () => {
    const result = generateAutomatedPortfolio('invalid_user_999');
    
    expect(result.error).toBeDefined();
    expect(result.error).toContain('No GitHub account found');
  });
});
