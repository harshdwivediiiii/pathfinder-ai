import { describe, it, expect } from 'vitest';
import { simulateAgentNegotiation, activeAgents } from '../app/(main)/multi-agent-mentoring/_components/agent-algorithm.js';

describe('Multi-Agent System for Peer Mentoring Matching', () => {
  it('correctly matches peers with complementary skills and matching schedules', () => {
    const primaryUser = {
      name: "Test User",
      strongSkills: ['react', 'css'], // Can teach frontend
      weakSkills: ['node', 'sql'], // Needs backend
      schedule: ['evenings'],
      learningGoal: 'Fullstack Mastery'
    };
    
    const outcome = simulateAgentNegotiation(primaryUser);
    
    // There are 4 agents.
    // Agent 1 (Alex): Backend. Needs React/CSS. Available Evenings. Matches Goal. (Perfect Match)
    // Agent 2 (Sarah): UI. Needs Node. Available Mornings/Weekends (Schedule Conflict)
    // Agent 3 (David): Data. Needs React. Available Evenings (OK match, wrong goal)
    // Agent 4 (Elena): Frontend. Needs Python. Available Evenings. (No skill overlap)
    
    // Alex (Agent 1) should be the absolute top match
    expect(outcome.proposals.length).toBeGreaterThan(0);
    expect(outcome.proposals[0].peer.name).toContain('Alex');
    
    // Check synergy factors for Alex
    const alexSynergy = outcome.proposals[0].synergyFactors.join(' ');
    expect(alexSynergy).toContain('Schedule sync: evenings');
    expect(alexSynergy).toContain('User can teach: react, css');
    expect(alexSynergy).toContain('Peer can teach: node, sql');
    
    // Sarah should NOT be in the proposals because of a strict schedule conflict
    const sarahProposal = outcome.proposals.find(p => p.peer.name.includes('Sarah'));
    expect(sarahProposal).toBeUndefined();
  });
});
