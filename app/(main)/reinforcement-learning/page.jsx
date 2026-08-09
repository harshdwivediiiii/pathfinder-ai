"use client";

import React, { useState, useEffect } from "react";
import { initializeArms, selectArm, updateArm, simulateUserEngagement } from "./_components/rl-algorithm";
import { Dices, Video, FileText, MousePointerClick, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function RLRecommendationPage() {
  const [arms, setArms] = useState(initializeArms());
  const [iteration, setIteration] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const performStep = () => {
      setArms(prevArms => {
          // 1. Epsilon-Greedy Selection (epsilon = 0.15 for exploration)
          const selectedArmId = selectArm(prevArms, 0.15);
          
          // 2. Environment Feedback (User engages with the content)
          const reward = simulateUserEngagement(selectedArmId);
          
          // 3. Update Q-Values
          const updatedArms = updateArm(prevArms, selectedArmId, reward);
          
          // Logging
          setLogs(prev => {
              const newLogs = [`Iter ${iteration + 1}: Served ${selectedArmId.toUpperCase()}. Engagement: ${(reward * 100).toFixed(1)}%`, ...prev];
              if (newLogs.length > 5) newLogs.pop();
              return newLogs;
          });
          
          setIteration(i => i + 1);
          
          return updatedArms;
      });
  };

  useEffect(() => {
      let interval;
      if (isSimulating) {
          interval = setInterval(() => {
              performStep();
          }, 400); // Fast simulation
      }
      return () => clearInterval(interval);
  }, [isSimulating, iteration]);

  const resetSimulation = () => {
      setIsSimulating(false);
      setArms(initializeArms());
      setIteration(0);
      setLogs([]);
  };

  const getIconForArm = (id) => {
      switch(id) {
          case 'video': return <Video className="w-5 h-5 text-rose-500" />;
          case 'text': return <FileText className="w-5 h-5 text-blue-500" />;
          case 'interactive': return <MousePointerClick className="w-5 h-5 text-emerald-500" />;
          default: return <FileText className="w-5 h-5" />;
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
          <Dices className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RL Content Recommendations</h1>
          <p className="text-muted-foreground">Multi-Armed Bandit algorithm that dynamically learns the optimal content format for an individual user to maximize engagement.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Arms Status */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm min-h-[500px] flex flex-col">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <div>Content Format Q-Values (Expected Reward)</div>
                <div className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                    Iteration: {iteration}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6">
                
               <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
                   <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                   <p className="text-sm text-orange-800 dark:text-orange-300">
                       <strong>Hidden Environment Variable:</strong> This specific simulated user heavily prefers <span className="font-bold underline">Interactive Code Quizzes</span> and drops off quickly during Video Lectures. Watch the algorithm discover this preference via exploration.
                   </p>
               </div>
               
               <div className="space-y-6 pt-4">
                  {arms.map((arm) => (
                      <div key={arm.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                  {getIconForArm(arm.id)}
                                  <span className="font-semibold">{arm.label}</span>
                              </div>
                              <div className="text-sm space-x-4">
                                  <span className="text-muted-foreground">Pulls: {arm.pulls}</span>
                                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                                      Q-Value: {arm.qValue.toFixed(3)}
                                  </span>
                              </div>
                          </div>
                          {/* Visual Q-value representation */}
                          <Progress value={arm.qValue * 100} className="h-3" />
                      </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls & Logs */}
        <div className="space-y-6">
          <Card className="border-orange-500/20 shadow-sm">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/20 pb-4 border-b border-orange-100 dark:border-orange-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    Agent Controls
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <Button 
                onClick={() => setIsSimulating(!isSimulating)}
                className={`w-full ${isSimulating ? 'bg-amber-600 hover:bg-amber-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                  {isSimulating ? "Pause Simulation" : "Start Auto-Simulation"}
              </Button>
              
              <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={performStep} disabled={isSimulating}>
                      Step +1
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={resetSimulation}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Reset
                  </Button>
              </div>

            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Agent Action Log</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-2 pt-2">
                  {logs.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic text-center py-4">No actions taken yet.</div>
                  ) : (
                      logs.map((log, i) => (
                          <div key={i} className={`text-xs font-mono p-2 rounded border ${i === 0 ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50 text-orange-800 dark:text-orange-300' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                              {log}
                          </div>
                      ))
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
