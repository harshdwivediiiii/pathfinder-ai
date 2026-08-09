"use client";

import React, { useState } from "react";
import { simulateAgentNegotiation } from "./_components/agent-algorithm";
import { Users, Bot, Handshake, CheckCircle2, MessageSquareText, Calendar, Zap, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MultiAgentMentoringPage() {
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [results, setResults] = useState(null);

  // Mock primary user (The person viewing the page)
  const primaryUserProfile = {
      name: "You (Primary User)",
      strongSkills: ['react', 'css'],
      weakSkills: ['node', 'sql'],
      schedule: ['evenings'],
      learningGoal: 'Fullstack Mastery'
  };

  const startNegotiation = () => {
      setIsNegotiating(true);
      setResults(null);
      
      // Simulate multi-agent async negotiation latency
      setTimeout(() => {
          const outcome = simulateAgentNegotiation(primaryUserProfile);
          setResults(outcome);
          setIsNegotiating(false);
      }, 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <Users className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Autonomous Peer Matching</h1>
          <p className="text-muted-foreground">Multi-Agent system that negotiates schedule overlaps and complementary skill gaps to find your perfect study partner.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: User Profile & Action */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Bot className="w-5 h-5 text-amber-500" />
                 Your Agent Proxy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6">
                
              <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">My Strong Skills (Can Teach)</h4>
                  <div className="flex flex-wrap gap-2">
                      {primaryUserProfile.strongSkills.map(s => <Badge key={s} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">{s}</Badge>)}
                  </div>
              </div>
              
              <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">My Weak Skills (Need Help)</h4>
                  <div className="flex flex-wrap gap-2">
                      {primaryUserProfile.weakSkills.map(s => <Badge key={s} variant="outline" className="border-rose-200 text-rose-700 bg-rose-50">{s}</Badge>)}
                  </div>
              </div>
              
              <div className="p-3 bg-slate-50 border rounded-lg text-sm flex justify-between items-center dark:bg-slate-900/30">
                  <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4"/> Availability</span>
                  <span className="font-semibold capitalize">{primaryUserProfile.schedule.join(', ')}</span>
              </div>
              
              <Button 
                  onClick={startNegotiation} 
                  disabled={isNegotiating}
                  className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white h-12"
              >
                  {isNegotiating ? "Agents Negotiating..." : "Deploy Agent to Find Peers"}
              </Button>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Agent Swarm Negotiation & Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {!results && !isNegotiating && (
              <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
                  <Handshake className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                  <p>Ready to find a mentor or peer.</p>
                  <p className="text-sm">Click "Deploy Agent" to dispatch your proxy into the swarm.</p>
              </div>
          )}
          
          {isNegotiating && (
              <div className="h-full border rounded-xl flex flex-col items-center justify-center p-12 text-center bg-card">
                  <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-b-transparent animate-spin animation-delay-500 rotate-45 scale-75"></div>
                      <Bot className="w-8 h-8 text-amber-500 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Swarm Negotiation Active</h3>
                  <p className="text-sm text-muted-foreground animate-pulse">Your agent is evaluating schedules and skills with 42 online peers...</p>
              </div>
          )}
          
          {results && !isNegotiating && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <Card className="border-amber-500/20 shadow-sm overflow-hidden">
                    <div className="bg-amber-500 h-1 w-full"></div>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex justify-between items-center">
                            Optimal Peer Proposals
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                {results.proposals.length} Matches Found
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        
                        {results.proposals.length === 0 ? (
                            <div className="text-center p-6 bg-slate-50 text-slate-500 rounded-lg">
                                No viable matches found right now. Check back later!
                            </div>
                        ) : (
                            results.proposals.map((proposal, idx) => (
                                <div key={idx} className={`p-5 rounded-xl border ${idx === 0 ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20' : 'bg-card'} flex flex-col gap-4 relative`}>
                                    
                                    {idx === 0 && (
                                        <Badge className="absolute -top-3 -right-3 bg-amber-500 flex gap-1 items-center">
                                            <Zap className="w-3 h-3"/> Top Match
                                        </Badge>
                                    )}
                                    
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg flex items-center gap-2">
                                                {proposal.peer.name}
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </h4>
                                            <p className="text-sm text-muted-foreground">Match Score: {proposal.matchScore}</p>
                                        </div>
                                        <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                                            Connect <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="text-xs font-semibold text-slate-500 uppercase">Synergy Profile</span>
                                            <ul className="text-sm space-y-1">
                                                {proposal.synergyFactors.map((factor, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                                                        <span className="text-emerald-500 mt-1">•</span> {factor}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    
                                </div>
                            ))
                        )}
                        
                    </CardContent>
                </Card>
                
                {/* Agent Logs */}
                <Card className="border border-slate-200 bg-slate-900 text-slate-300 font-mono text-xs shadow-inner">
                    <CardHeader className="py-3 px-4 border-b border-slate-800 bg-slate-950">
                        <CardTitle className="text-sm font-normal flex items-center gap-2 text-slate-400">
                            <MessageSquareText className="w-4 h-4" /> Agent Telemetry Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 max-h-[150px] overflow-y-auto space-y-1 opacity-80">
                        {results.logs.map((log, i) => (
                            <div key={i} className={log.includes('Proposed') ? 'text-amber-400' : log.includes('Rejected') ? 'text-rose-400' : 'text-slate-500'}>
                                > {log}
                            </div>
                        ))}
                    </CardContent>
                </Card>
                
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
