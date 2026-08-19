import { describe, it, expect } from 'vitest';
import { clusterStudyGroups } from '../app/(main)/study-group-clustering/_components/clustering-algorithm.js';

describe('Auto-Generating Study Groups based on Clustering Algorithms', () => {
  const currentUser = { id: 'u_0', currentTopicId: 'react', timezoneOffset: 0, learningPace: 5 };

  it('clusters the closest peers based on Euclidean distance of timezone and pace', () => {
    const pool = [
      { id: 'u_1', currentTopicId: 'react', timezoneOffset: 0, learningPace: 5 },   // Dist: 0
      { id: 'u_2', currentTopicId: 'react', timezoneOffset: 12, learningPace: 10 }, // Dist: ~13
      { id: 'u_3', currentTopicId: 'react', timezoneOffset: 1, learningPace: 6 },   // Dist: ~1.4
      { id: 'u_4', currentTopicId: 'react', timezoneOffset: 2, learningPace: 5 },   // Dist: 2
      { id: 'u_5', currentTopicId: 'react', timezoneOffset: -1, learningPace: 4 }   // Dist: ~1.4
    ];
    
    const result = clusterStudyGroups(pool, currentUser);
    
    expect(result.group.length).toBe(3); // Expect top 3 closest
    
    // u_1 is a perfect match (dist 0), should be first
    expect(result.group[0].id).toBe('u_1');
    
    // u_2 is furthest, should NOT be in the group
    expect(result.group.some(p => p.id === 'u_2')).toBe(false);
  });
  
  it('strictly filters out users studying different topics', () => {
    const pool = [
      { id: 'u_1', currentTopicId: 'react', timezoneOffset: 0, learningPace: 5 },
      { id: 'u_2', currentTopicId: 'python', timezoneOffset: 0, learningPace: 5 }, // Wrong topic
      { id: 'u_3', currentTopicId: 'react', timezoneOffset: 0, learningPace: 5 }
    ];
    
    const result = clusterStudyGroups(pool, currentUser);
    
    // Total group should only have u_1 and u_3
    expect(result.group.length).toBe(2);
    expect(result.group.some(p => p.id === 'u_2')).toBe(false);
  });
  
  it('returns a gentle failure state if not enough peers are available', () => {
    const smallPool = [
      { id: 'u_1', currentTopicId: 'react', timezoneOffset: 0, learningPace: 5 }
    ];
    
    const result = clusterStudyGroups(smallPool, currentUser);
    
    expect(result.group.length).toBe(0);
    expect(result.message).toContain('Not enough active users');
  });
});
