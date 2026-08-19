"use client";

import React, { useState, useEffect } from "react";
import { DaoGovernanceSimulator } from "./_components/smart-contract-simulator";
import { Vote, Coins, ShieldCheck, ThumbsUp, ThumbsDown, Lock, CheckCircle2, History, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DaoGovernancePage() {
  const [dao, setDao] = useState(null);
  const [activeUser, setActiveUser] = useState("0x_user_abcd1234");
  const [votingPower, setVotingPower] = useState(0);
  
  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [txHash, setTxHash] = useState("");

  // Initialize DAO state
  useEffect(() => {
      const simulator = new DaoGovernanceSimulator();
      
      // Setup initial state: User has 50 SBTs (Voting Power)
      simulator.mintSBT(activeUser, 50);
      setVotingPower(50);
      
      // Create some seed proposals by a fake admin
      simulator.mintSBT("0x_admin_9999", 1000);
      simulator.createProposal("0x_admin_9999", "Bounty: WebRTC Collaborative Editor", "Allocate $500 USDC to build a real-time collaborative code editor for capstone projects.", 500);
      simulator.createProposal("0x_admin_9999", "Curriculum: Rust for Smart Contracts", "Add a new learning pathway covering Rust for Solana smart contract development.", 0);
      
      setDao(simulator);
      
      // Load proposals into UI state
      refreshProposals(simulator);
  }, [activeUser]);

  const refreshProposals = (simulatorInstance) => {
      const props = Array.from(simulatorInstance.proposals.values());
      setProposals(props.reverse()); // Newest first
  };

  const handleVote = async (proposalId, support) => {
      if (!dao) return;
      setIsVoting(proposalId);
      setTxHash("");

      try {
          const result = await dao.castVote(activeUser, proposalId, support);
          setTxHash(result.transactionHash);
          refreshProposals(dao);
      } catch (e) {
          console.error(e);
          alert(e.message);
      } finally {
          setIsVoting(false);
      }
  };

  const calculateBarWidth = (forVotes, againstVotes, type) => {
      const total = forVotes + againstVotes;
      if (total === 0) return '0%';
      if (type === 'for') return `${(forVotes / total) * 100}%`;
      return `${(againstVotes / total) * 100}%`;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Vote className="w-10 h-10 text-emerald-500" />
            Pathfinder DAO Governance
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Use your earned Soulbound Tokens (SBTs) to vote on platform features and bounties.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl shadow-inner">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-full text-white">
                <Coins className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Your Voting Power</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{votingPower} SBT</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500"/> Active Proposals</h2>
            
            {proposals.map(proposal => (
                <Card key={proposal.id} className="border-emerald-500/20 overflow-hidden transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{proposal.title}</CardTitle>
                                <CardDescription className="mt-1 font-mono text-xs">Prop ID: {proposal.id}</CardDescription>
                            </div>
                            <span className="bg-emerald-500/20 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase border border-emerald-500/30">
                                {proposal.status}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <p className="text-muted-foreground">{proposal.description}</p>
                        
                        {proposal.executionBudget > 0 && (
                            <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-3 py-1.5 rounded-md text-sm font-semibold">
                                <AlertCircle className="w-4 h-4" /> Requires Treasury Budget: ${proposal.executionBudget} USDC
                            </div>
                        )}

                        <div className="bg-background border rounded-xl p-4 space-y-4 shadow-inner">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-green-500">For: {proposal.votesFor} SBT</span>
                                <span className="text-red-500">Against: {proposal.votesAgainst} SBT</span>
                            </div>
                            
                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                                <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: calculateBarWidth(proposal.votesFor, proposal.votesAgainst, 'for') }}></div>
                                <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: calculateBarWidth(proposal.votesFor, proposal.votesAgainst, 'against') }}></div>
                            </div>

                            {!proposal.voters.has(activeUser) ? (
                                <div className="flex gap-4 pt-2">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 border-green-500/50 text-green-600 hover:bg-green-500 hover:text-white"
                                        onClick={() => handleVote(proposal.id, true)}
                                        disabled={isVoting === proposal.id}
                                    >
                                        <ThumbsUp className="w-4 h-4 mr-2" /> Vote For
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 border-red-500/50 text-red-600 hover:bg-red-500 hover:text-white"
                                        onClick={() => handleVote(proposal.id, false)}
                                        disabled={isVoting === proposal.id}
                                    >
                                        <ThumbsDown className="w-4 h-4 mr-2" /> Vote Against
                                    </Button>
                                </div>
                            ) : (
                                <div className="pt-2 text-center text-sm font-semibold text-emerald-500 flex items-center justify-center gap-2 bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                                    <CheckCircle2 className="w-4 h-4" /> You have already cast your vote on this proposal.
                                </div>
                            )}
                            
                            {isVoting === proposal.id && (
                                <p className="text-xs text-center font-mono text-muted-foreground animate-pulse">Confirming smart contract transaction...</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="space-y-6">
            <Card className="h-full border-dashed flex flex-col bg-secondary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Voting Ledger
                    </CardTitle>
                    <CardDescription>Recent on-chain DAO activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                    {txHash ? (
                        <div className="p-4 bg-background border rounded-lg space-y-2 animate-in slide-in-from-right-4 shadow-sm">
                            <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm font-bold">Vote Committed</span>
                            </div>
                            <p className="text-xs text-muted-foreground break-all font-mono bg-muted p-2 rounded">
                                TX: {txHash}
                            </p>
                            <p className="text-xs opacity-70">
                                Weight: {votingPower} SBT attached to payload.
                            </p>
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground opacity-50 flex flex-col items-center justify-center h-full">
                            <ShieldCheck className="w-12 h-12 mb-2" />
                            <p className="text-sm">Cast a vote to view cryptographic ledger entries.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
