import { describe, it, expect } from 'vitest';
import { parseVoiceInput, parseImageInput } from '../app/(main)/multi-modal-input/_components/multi-modal-algorithm.js';

describe('Multi-Modal Input (Voice/Image) for Pathway Querying', () => {
  it('parses a chaotic voice transcript and extracts structured technical skills', () => {
    const transcript = "I really want to learn React and some backend stuff with Node eventually. Maybe Python too.";
    const result = parseVoiceInput(transcript);
    
    expect(result.error).toBeUndefined();
    expect(result.pathway.length).toBe(3); // react, node, python
    
    expect(result.pathway[0].title.toLowerCase()).toContain('react');
    expect(result.pathway[1].title.toLowerCase()).toContain('node');
    expect(result.pathway[2].title.toLowerCase()).toContain('python');
    
    expect(result.source).toContain('Voice');
  });
  
  it('returns an error if no tech keywords are found in voice input', () => {
    const emptyTranscript = "I just want to be rich and famous.";
    const result = parseVoiceInput(emptyTranscript);
    
    expect(result.error).toBeDefined();
    expect(result.pathway).toBeUndefined();
  });
  
  it('parses image labels (simulated VLM output) into a structured pathway', () => {
    const labels = ["frontend", "javascript", "react"];
    const result = parseImageInput(labels);
    
    expect(result.error).toBeUndefined();
    expect(result.pathway.length).toBe(3);
    
    // Check capitalization logic in mapping
    expect(result.pathway[0].title).toBe("Frontend");
    expect(result.pathway[1].title).toBe("Javascript");
    
    expect(result.source).toContain('Image');
  });
});
