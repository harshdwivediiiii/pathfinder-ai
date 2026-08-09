"use client";

import React, { useState } from "react";
import { Shield, Award, Landmark, TrendingUp, CheckCircle, XCircle, Plus, Info, RefreshCw, BarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const PROPOSALS = [
  {
    id: 1,
    title: "DAO Treasury Allocation Proposal 1",
    proposer: "0x0000...0000",
    description: "Distribute 1.5 ETH from treasury to top 3 open-source tool libraries contributing to PathFinder.",
    status: "Active",
    votesFor: 12000,
    votesAgainst: 450,
    quorum: 15000
  },
  {
    id: 2,
    title: "Upgrade Gas Modifiers Proposal 1",
    proposer: "0x0020...0051",
    description: "Apply gas-optimized smart contract proxy layouts to reduce validation friction.",
    status: "Passed",
    votesFor: 25000,
    votesAgainst: 100,
    quorum: 15000
  },
  {
    id: 3,
    title: "Membership Token Staking Proposal 1",
    proposer: "0x0040...00a2",
    description: "Require 500 Gssoc tokens to unlock advanced resume analyzer features on staging.",
    status: "Active",
    votesFor: 8900,
    votesAgainst: 1200,
    quorum: 15000
  },
  {
    id: 4,
    title: "Core L2 Bridge Deployment Proposal 1",
    proposer: "0x0060...00f3",
    description: "Migrate Soulbound Certificate Token minting structures to Polygon Hermez.",
    status: "Defeated",
    votesFor: 4500,
    votesAgainst: 7800,
    quorum: 15000
  },
  {
    id: 5,
    title: "Revise Proposal Quorum Proposal 1",
    proposer: "0x0080...0144",
    description: "Adjust quorum weight limits from 20% total staked supply to 15% for fast-track issues.",
    status: "Passed",
    votesFor: 19500,
    votesAgainst: 200,
    quorum: 15000
  },
  {
    id: 6,
    title: "DAO Treasury Allocation Proposal 2",
    proposer: "0x00a0...0195",
    description: "Distribute 1.5 ETH from treasury to top 3 open-source tool libraries contributing to PathFinder.",
    status: "Active",
    votesFor: 12000,
    votesAgainst: 450,
    quorum: 15000
  },
  {
    id: 7,
    title: "Upgrade Gas Modifiers Proposal 2",
    proposer: "0x00c0...01e6",
    description: "Apply gas-optimized smart contract proxy layouts to reduce validation friction.",
    status: "Passed",
    votesFor: 25000,
    votesAgainst: 100,
    quorum: 15000
  },
  {
    id: 8,
    title: "Membership Token Staking Proposal 2",
    proposer: "0x00e0...0237",
    description: "Require 500 Gssoc tokens to unlock advanced resume analyzer features on staging.",
    status: "Active",
    votesFor: 8900,
    votesAgainst: 1200,
    quorum: 15000
  },
  {
    id: 9,
    title: "Core L2 Bridge Deployment Proposal 2",
    proposer: "0x0100...0288",
    description: "Migrate Soulbound Certificate Token minting structures to Polygon Hermez.",
    status: "Defeated",
    votesFor: 4500,
    votesAgainst: 7800,
    quorum: 15000
  },
  {
    id: 10,
    title: "Revise Proposal Quorum Proposal 2",
    proposer: "0x0120...02d9",
    description: "Adjust quorum weight limits from 20% total staked supply to 15% for fast-track issues.",
    status: "Passed",
    votesFor: 19500,
    votesAgainst: 200,
    quorum: 15000
  },
  {
    id: 11,
    title: "DAO Treasury Allocation Proposal 3",
    proposer: "0x0140...032a",
    description: "Distribute 1.5 ETH from treasury to top 3 open-source tool libraries contributing to PathFinder.",
    status: "Active",
    votesFor: 12000,
    votesAgainst: 450,
    quorum: 15000
  },
  {
    id: 12,
    title: "Upgrade Gas Modifiers Proposal 3",
    proposer: "0x0160...037b",
    description: "Apply gas-optimized smart contract proxy layouts to reduce validation friction.",
    status: "Passed",
    votesFor: 25000,
    votesAgainst: 100,
    quorum: 15000
  },
  {
    id: 13,
    title: "Membership Token Staking Proposal 3",
    proposer: "0x0180...03cc",
    description: "Require 500 Gssoc tokens to unlock advanced resume analyzer features on staging.",
    status: "Active",
    votesFor: 8900,
    votesAgainst: 1200,
    quorum: 15000
  },
  {
    id: 14,
    title: "Core L2 Bridge Deployment Proposal 3",
    proposer: "0x01a0...041d",
    description: "Migrate Soulbound Certificate Token minting structures to Polygon Hermez.",
    status: "Defeated",
    votesFor: 4500,
    votesAgainst: 7800,
    quorum: 15000
  },
  {
    id: 15,
    title: "Revise Proposal Quorum Proposal 3",
    proposer: "0x01c0...046e",
    description: "Adjust quorum weight limits from 20% total staked supply to 15% for fast-track issues.",
    status: "Passed",
    votesFor: 19500,
    votesAgainst: 200,
    quorum: 15000
  },
  {
    id: 16,
    title: "DAO Treasury Allocation Proposal 4",
    proposer: "0x01e0...04bf",
    description: "Distribute 1.5 ETH from treasury to top 3 open-source tool libraries contributing to PathFinder.",
    status: "Active",
    votesFor: 12000,
    votesAgainst: 450,
    quorum: 15000
  },
  {
    id: 17,
    title: "Upgrade Gas Modifiers Proposal 4",
    proposer: "0x0200...0510",
    description: "Apply gas-optimized smart contract proxy layouts to reduce validation friction.",
    status: "Passed",
    votesFor: 25000,
    votesAgainst: 100,
    quorum: 15000
  },
  {
    id: 18,
    title: "Membership Token Staking Proposal 4",
    proposer: "0x0220...0561",
    description: "Require 500 Gssoc tokens to unlock advanced resume analyzer features on staging.",
    status: "Active",
    votesFor: 8900,
    votesAgainst: 1200,
    quorum: 15000
  },
  {
    id: 19,
    title: "Core L2 Bridge Deployment Proposal 4",
    proposer: "0x0240...05b2",
    description: "Migrate Soulbound Certificate Token minting structures to Polygon Hermez.",
    status: "Defeated",
    votesFor: 4500,
    votesAgainst: 7800,
    quorum: 15000
  },
  {
    id: 20,
    title: "Revise Proposal Quorum Proposal 4",
    proposer: "0x0260...0603",
    description: "Adjust quorum weight limits from 20% total staked supply to 15% for fast-track issues.",
    status: "Passed",
    votesFor: 19500,
    votesAgainst: 200,
    quorum: 15000
  },
  {
    id: 21,
    title: "DAO Treasury Allocation Proposal 5",
    proposer: "0x0280...0654",
    description: "Distribute 1.5 ETH from treasury to top 3 open-source tool libraries contributing to PathFinder.",
    status: "Active",
    votesFor: 12000,
    votesAgainst: 450,
    quorum: 15000
  },
  {
    id: 22,
    title: "Upgrade Gas Modifiers Proposal 5",
    proposer: "0x02a0...06a5",
    description: "Apply gas-optimized smart contract proxy layouts to reduce validation friction.",
    status: "Passed",
    votesFor: 25000,
    votesAgainst: 100,
    quorum: 15000
  },
  {
    id: 23,
    title: "Membership Token Staking Proposal 5",
    proposer: "0x02c0...06f6",
    description: "Require 500 Gssoc tokens to unlock advanced resume analyzer features on staging.",
    status: "Active",
    votesFor: 8900,
    votesAgainst: 1200,
    quorum: 15000
  },
  {
    id: 24,
    title: "Core L2 Bridge Deployment Proposal 5",
    proposer: "0x02e0...0747",
    description: "Migrate Soulbound Certificate Token minting structures to Polygon Hermez.",
    status: "Defeated",
    votesFor: 4500,
    votesAgainst: 7800,
    quorum: 15000
  },
  {
    id: 25,
    title: "Revise Proposal Quorum Proposal 5",
    proposer: "0x0300...0798",
    description: "Adjust quorum weight limits from 20% total staked supply to 15% for fast-track issues.",
    status: "Passed",
    votesFor: 19500,
    votesAgainst: 200,
    quorum: 15000
  },
  {
    id: 26,
    title: "DAO Treasury Allocation Proposal 6",
    proposer: "0x0320...07e9",
    description: "Distribute 1.5 ETH from treasury to top 3 open-source tool libraries contributing to PathFinder.",
    status: "Active",
    votesFor: 12000,
    votesAgainst: 450,
    quorum: 15000
  },
  {
    id: 27,
    title: "Upgrade Gas Modifiers Proposal 6",
    proposer: "0x0340...083a",
    description: "Apply gas-optimized smart contract proxy layouts to reduce validation friction.",
    status: "Passed",
    votesFor: 25000,
    votesAgainst: 100,
    quorum: 15000
  },
  {
    id: 28,
    title: "Membership Token Staking Proposal 6",
    proposer: "0x0360...088b",
    description: "Require 500 Gssoc tokens to unlock advanced resume analyzer features on staging.",
    status: "Active",
    votesFor: 8900,
    votesAgainst: 1200,
    quorum: 15000
  },
  {
    id: 29,
    title: "Core L2 Bridge Deployment Proposal 6",
    proposer: "0x0380...08dc",
    description: "Migrate Soulbound Certificate Token minting structures to Polygon Hermez.",
    status: "Defeated",
    votesFor: 4500,
    votesAgainst: 7800,
    quorum: 15000
  },
  {
    id: 30,
    title: "Revise Proposal Quorum Proposal 6",
    proposer: "0x03a0...092d",
    description: "Adjust quorum weight limits from 20% total staked supply to 15% for fast-track issues.",
    status: "Passed",
    votesFor: 19500,
    votesAgainst: 200,
    quorum: 15000
  },
];

export default function DAOGovernancePage() {
  const [proposals, setProposals] = useState(PROPOSALS);
  const [votingWeight, setVotingWeight] = useState(500);

  const handleVote = (id, direction) => {
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          votesFor: direction === "for" ? p.votesFor + votingWeight : p.votesFor,
          votesAgainst: direction === "against" ? p.votesAgainst + votingWeight : p.votesAgainst
        };
      }
      return p;
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Landmark className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">DAO Platform Governance</h1>
          <p className="text-muted-foreground">Staking tools, governance proposals, treasury allocations, and smart contract execution logs.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Active Governance Proposals</CardTitle>
              <CardDescription>Vote on platform integrations, treasury layouts, and deployment changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {proposals.map((prop) => {
                const total = prop.votesFor + prop.votesAgainst;
                const ratio = total > 0 ? (prop.votesFor / total) * 100 : 0;
                
                return (
                  <div key={prop.id} className="p-4 border rounded-xl border-border/60 bg-muted/20 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm text-card-foreground leading-snug">{prop.title}</h4>
                        <span className="text-[10px] text-muted-foreground font-mono">Proposer: {prop.proposer}</span>
                      </div>
                      <Badge
                        className={{
                          "Active": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
                          "Passed": "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
                          "Defeated": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        }[prop.status]}
                      >
                        {prop.status}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed">{prop.description}</p>

                    <div className="space-y-2 border-t pt-3 border-border/10">
                      <div className="flex justify-between text-xs font-mono">
                        <span>For: {prop.votesFor} VP ({ratio.toFixed(1)}%)</span>
                        <span>Against: {prop.votesAgainst} VP ({(100 - ratio).toFixed(1)}%)</span>
                      </div>
                      <Progress value={ratio} className="h-2" />
                    </div>

                    {prop.status === "Active" && (
                      <div className="flex justify-end gap-3 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleVote(prop.id, "against")} className="text-red-600 hover:text-red-700">Vote Against</Button>
                        <Button size="sm" onClick={() => handleVote(prop.id, "for")} className="bg-indigo-600 hover:bg-indigo-700 text-white">Vote For</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Governance Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/40 rounded-xl border border-border/30 text-center">
                <div className="text-xs text-muted-foreground font-medium mb-1">Your Voting Power</div>
                <div className="text-3xl font-extrabold text-indigo-600">{votingWeight} VP</div>
                <div className="text-[10px] text-muted-foreground mt-1">Staked Gssoc Tokens</div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Platform Treasury Vault
                </h4>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b pb-1 border-border/20">
                    <span className="text-muted-foreground">ETH Reserves:</span>
                    <span className="font-semibold text-foreground">42.50 ETH</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-border/20">
                    <span className="text-muted-foreground">Gssoc Staked:</span>
                    <span className="font-semibold text-foreground">1,250,000 GSSOC</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-border/20">
                    <span className="text-muted-foreground">Active Proposals:</span>
                    <span className="font-semibold text-foreground">{proposals.filter(p => p.status === "Active").length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
