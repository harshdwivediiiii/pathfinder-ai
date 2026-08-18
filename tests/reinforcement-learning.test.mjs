import { describe, it, expect } from 'vitest';
import { initializeArms, selectArm, updateArm, simulateUserEngagement } from '../app/(main)/reinforcement-learning/_components/rl-algorithm.js';

describe('Reinforcement Learning Content Recommendations', () => {
  it('updates Q-values correctly and converges towards the optimal arm', () => {
    
    let arms = initializeArms();
    
    // Initial state
    expect(arms.length).toBe(3);
    expect(arms[0].qValue).toBe(0.5);
    
    // Simulate 100 pulls for the 'interactive' arm, which has high base reward
    for(let i=0; i<100; i++) {
        const reward = simulateUserEngagement('interactive');
        arms = updateArm(arms, 'interactive', reward);
    }
    
    const interactiveArm = arms.find(a => a.id === 'interactive');
    expect(interactiveArm.pulls).toBe(100);
    // Because base is 0.9, the qValue should converge somewhere near 0.9
    expect(interactiveArm.qValue).toBeGreaterThan(0.7);
    
    // Simulate 100 pulls for the 'video' arm, which has low base reward
    for(let i=0; i<100; i++) {
        const reward = simulateUserEngagement('video');
        arms = updateArm(arms, 'video', reward);
    }
    
    const videoArm = arms.find(a => a.id === 'video');
    expect(videoArm.pulls).toBe(100);
    // Because base is 0.2, the qValue should converge somewhere near 0.2
    expect(videoArm.qValue).toBeLessThan(0.4);
    
    // Now if we select with epsilon=0 (pure exploitation), it should pick 'interactive'
    const bestArmId = selectArm(arms, 0.0);
    expect(bestArmId).toBe('interactive');
  });
});
