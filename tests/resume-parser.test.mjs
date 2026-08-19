import { describe, it, expect } from 'vitest';
import { parseResumeText, generateGapPathway } from '../app/(main)/resume-parser/_components/ner-algorithm.js';

describe('NLP-Based Resume to Pathway Auto-Generation', () => {
  it('extracts technical skills from raw text using simulated NER', () => {
    const rawText = "I am a frontend dev with 3 years of React experience. I also know JavaScript, HTML, and CSS.";
    const extracted = parseResumeText(rawText);
    
    expect(extracted).toContain('react');
    expect(extracted).toContain('javascript');
    expect(extracted).toContain('html');
    expect(extracted).toContain('css');
    
    // Shouldn't hallucinate skills
    expect(extracted).not.toContain('python');
    expect(extracted).not.toContain('node');
  });
  
  it('generates a gap pathway by subtracting known skills from target career requirements', () => {
    // User knows frontend
    const userSkills = ['react', 'javascript', 'html', 'css'];
    
    // User wants to be Fullstack
    const result = generateGapPathway(userSkills, 'fullstack');
    
    expect(result.targetTitle).toBe('Fullstack Web Developer');
    
    // Fullstack requires: ['html', 'css', 'javascript', 'react', 'node', 'express', 'sql', 'git']
    // User is missing: node, express, sql, git (4 skills)
    expect(result.missingSkills.length).toBe(4);
    expect(result.missingSkills).toContain('node');
    expect(result.missingSkills).toContain('sql');
    
    // They shouldn't be recommended react since they already know it
    expect(result.missingSkills).not.toContain('react');
    
    // Readiness score should be 50% (4 out of 8)
    expect(result.readinessScore).toBe(50);
    
    // The pathway should contain exactly the missing modules
    expect(result.recommendedPathway.length).toBe(4);
    expect(result.recommendedPathway[0].skill).toBe('node');
  });
});
