"use client";

import React, { useState } from "react";
import { simulateMarkovMilestone } from "./_components/markov-algorithm";
import { Route, Target, PlayCircle, Loader2, Trophy, Clock, GitBranch, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function MarkovMilestonePage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState(null);

  // Mock historical user telemetry
  const mockUserStats = {
      consistencyScore: 75, // Moderate consistency
      churnRiskScore: 30,   // Low risk of quitting
      averageModulesPerWeek: 1.5
  };
  
  const remainingModules = 12; // E.g., modules left to reach "Senior Dev"
  const linearPredictionWeeks = Math.ceil(remainingModules / mockUserStats.averageModulesPerWeek);

  const handleSimulate = () => {
      setIsSimulating(true);
      setResult(null);
      
      // Simulate running 1,000 Monte Carlo iterations
      setTimeout(() => {
          const outcome = simulateMarkovMilestone(mockUserStats, remainingModules);
          setResult(outcome);
          setIsSimulating(false);
      }, 2500);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
          <Route className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gamified Milestone Forecasting</h1>
          <p className="text-muted-foreground">Replace static progress bars with probabilistic Markov Chain simulations that account for human behavior.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: Traditional vs Markov Setup */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Target className="w-5 h-5 text-cyan-500" />
                 Milestone Goal: Senior React Dev
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-8">
              
              <div className="space-y-4">
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-slate-500">Modules Completed</span>
                          <span className="font-bold">24 / 36</span>
                      </div>
                      <Progress value={66} className="h-3 bg-slate-200 dark:bg-slate-800" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border">
                          <span className="text-xs text-slate-500 block mb-1">Avg Pace</span>
                          <span className="font-bold">{mockUserStats.averageModulesPerWeek} <span className="font-normal text-sm">mod/wk</span></span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border">
                          <span className="text-xs text-slate-500 block mb-1">Consistency</span>
                          <span className="font-bold">{mockUserStats.consistencyScore}%</span>
                      </div>
                  </div>
              </div>
              
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg text-rose-800 dark:text-rose-300">
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <GitBranch className="w-4 h-4" /> The Linear Fallacy
                  </h4>
                  <p className="text-sm opacity-90">
                      Standard platforms divide {remainingModules} modules by {mockUserStats.averageModulesPerWeek} mod/wk to predict exactly <strong>{linearPredictionWeeks} weeks</strong>. This ignores inevitable cognitive burnout and difficult topics.
                  </p>
              </div>
              
              <Button 
                  onClick={handleSimulate} 
                  disabled={isSimulating}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-12"
              >
                  {isSimulating ? (
                      <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Simulating 1,000 Trajectories...
                      </>
                  ) : (
                      <>
                          <PlayCircle className="w-5 h-5 mr-2" /> Run Markov Chain Forecast
                      </>
                  )}
              </Button>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Probabilistic Output */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Clock className="w-5 h-5 text-emerald-400" />
                 Probabilistic Timeline Forecast
              </CardTitle>
              <CardDescription className="text-slate-400">Monte Carlo simulation results.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              
              {!result && !isSimulating && (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                      <Calendar className="w-12 h-12 mb-4 opacity-50" />
                      <p>Awaiting simulation run...</p>
                  </div>
              )}
              
              {isSimulating && (
                  <div className="text-center flex flex-col items-center text-cyan-400">
                      <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                      <p className="animate-pulse font-mono text-sm">Calculating transition matrices (Productive → Stuck → Inactive)...</p>
                  </div>
              )}
              
              {result && !isSimulating && (
                  <div className="space-y-6 animate-in zoom-in-95 duration-500">
                      
                      <div className="text-center space-y-2">
                          <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-widest">Realistic Forecast</h3>
                          <div className="text-4xl font-black text-white">{result.projectedDate}</div>
                          <p className="text-slate-400">Based on behavioral data, expect ~{result.expectedWeeks} weeks (Linear estimate was {linearPredictionWeeks}).</p>
                      </div>
                      
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                          
                          <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center shrink-0">
                                  <Trophy className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                  <h4 className="font-bold text-lg text-emerald-400 mb-1">{result.confidencePercentage}% Confidence Rating</h4>
                                  <p className="text-slate-300 text-sm leading-relaxed">{result.message}</p>
                              </div>
                          </div>
                          
                      </div>
                      
                  </div>
              )}
              
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
