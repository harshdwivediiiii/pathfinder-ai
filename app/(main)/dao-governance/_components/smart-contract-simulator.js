/**
 * Simulates a Smart Contract environment for a Decentralized Autonomous Organization (DAO).
 * Allows users holding Soulbound Tokens (SBTs) to vote on platform proposals.
 */

export class DaoGovernanceSimulator {
    constructor() {
        this.proposals = new Map();
        this.userWallets = new Map();
    }

    // Simulate minting a Soulbound Token for a user (represents voting power)
    mintSBT(userId, powerAmount) {
        if (!userId) throw new Error("User ID is required to mint SBT.");
        if (powerAmount <= 0) throw new Error("Voting power must be greater than zero.");

        const currentPower = this.userWallets.get(userId) || 0;
        this.userWallets.set(userId, currentPower + powerAmount);
        return { userId, newVotingPower: this.userWallets.get(userId) };
    }

    createProposal(proposerId, title, description, executionBudget) {
        if (!this.userWallets.has(proposerId)) {
            throw new Error("Only users with SBTs can create proposals.");
        }

        const proposalId = `prop_${Math.random().toString(36).substring(2, 9)}`;
        const proposal = {
            id: proposalId,
            proposerId,
            title,
            description,
            executionBudget,
            votesFor: 0,
            votesAgainst: 0,
            voters: new Set(),
            status: 'active', // active, passed, rejected
            createdAt: Date.now()
        };

        this.proposals.set(proposalId, proposal);
        return proposal;
    }

    castVote(userId, proposalId, support) {
        if (!this.userWallets.has(userId)) {
            throw new Error("Unauthorized: User holds no voting power (SBTs).");
        }

        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error("Proposal not found.");
        }

        if (proposal.status !== 'active') {
            throw new Error("Voting is closed for this proposal.");
        }

        if (proposal.voters.has(userId)) {
            throw new Error("Double voting is prevented by the smart contract.");
        }

        const votingPower = this.userWallets.get(userId);
        
        return new Promise((resolve) => {
            // Simulate blockchain transaction latency
            setTimeout(() => {
                if (support) {
                    proposal.votesFor += votingPower;
                } else {
                    proposal.votesAgainst += votingPower;
                }
                
                proposal.voters.add(userId);
                
                resolve({
                    transactionHash: `0x${Math.random().toString(16).substring(2, 10).padStart(64, '0')}`,
                    proposalState: this.getProposalState(proposalId)
                });
            }, 800);
        });
    }

    getProposalState(proposalId) {
        const p = this.proposals.get(proposalId);
        if (!p) return null;
        
        return {
            id: p.id,
            title: p.title,
            votesFor: p.votesFor,
            votesAgainst: p.votesAgainst,
            totalVotesCast: p.votesFor + p.votesAgainst,
            status: p.status
        };
    }

    evaluateProposal(proposalId, quorumThreshold = 100) {
        const p = this.proposals.get(proposalId);
        if (!p) throw new Error("Proposal not found.");

        const totalVotes = p.votesFor + p.votesAgainst;
        if (totalVotes < quorumThreshold) {
            p.status = 'rejected_no_quorum';
        } else if (p.votesFor > p.votesAgainst) {
            p.status = 'passed';
        } else {
            p.status = 'rejected';
        }
        
        return p.status;
    }
}
