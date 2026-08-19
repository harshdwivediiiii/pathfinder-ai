import { describe, it, expect, beforeEach } from 'vitest';
import { DaoGovernanceSimulator } from '../app/(main)/dao-governance/_components/smart-contract-simulator.js';

describe('Decentralized Autonomous Organization (DAO) for Platform Governance', () => {
    let dao;

    beforeEach(() => {
        dao = new DaoGovernanceSimulator();
    });

    it('should mint SBTs and assign voting power correctly', () => {
        const result = dao.mintSBT('user_1', 50);
        expect(result.newVotingPower).toBe(50);
        
        // Minting more to same user adds to balance
        const result2 = dao.mintSBT('user_1', 25);
        expect(result2.newVotingPower).toBe(75);
    });

    it('should throw error if non-SBT holder tries to create proposal', () => {
        expect(() => dao.createProposal('unauthorized_user', 'Title', 'Desc', 100)).toThrow("Only users with SBTs can create proposals");
    });

    it('should allow SBT holder to create a proposal', () => {
        dao.mintSBT('user_1', 10);
        const proposal = dao.createProposal('user_1', 'New Feature', 'Add DAO', 500);
        
        expect(proposal.id).toContain("prop_");
        expect(proposal.title).toBe("New Feature");
        expect(proposal.status).toBe("active");
    });

    it('should calculate votes based on SBT voting power', async () => {
        dao.mintSBT('admin', 1);
        const p = dao.createProposal('admin', 'Test', 'Test', 0);
        
        dao.mintSBT('voter_1', 100);
        dao.mintSBT('voter_2', 50);

        await dao.castVote('voter_1', p.id, true);
        await dao.castVote('voter_2', p.id, false);

        const state = dao.getProposalState(p.id);
        expect(state.votesFor).toBe(100);
        expect(state.votesAgainst).toBe(50);
    });

    it('should prevent double voting', async () => {
        dao.mintSBT('admin', 1);
        const p = dao.createProposal('admin', 'Test', 'Test', 0);
        
        dao.mintSBT('voter_1', 100);

        await dao.castVote('voter_1', p.id, true);
        expect(() => dao.castVote('voter_1', p.id, true)).toThrow("Double voting is prevented");
    });

    it('should evaluate proposal outcomes correctly', async () => {
        dao.mintSBT('admin', 1);
        const p = dao.createProposal('admin', 'Test', 'Test', 0);
        
        dao.mintSBT('voter_1', 150);
        await dao.castVote('voter_1', p.id, true);

        // Quorum is 100, votesFor = 150 -> passed
        expect(dao.evaluateProposal(p.id, 100)).toBe('passed');
    });
});
