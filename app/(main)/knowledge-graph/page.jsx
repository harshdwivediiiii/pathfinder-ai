"use client";

import React, { useState, useEffect, useMemo } from "react";
import { generateKnowledgeGraph, calculateDynamicPathway } from "./_components/graph-algorithm";
import { Network, Brain, Activity, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function KnowledgeGraphPage() {
  const baseGraph = useMemo(() => generateKnowledgeGraph(), []);
  
  const [completedSkills, setCompletedSkills] = useState(['math', 'prog']); 
  const [graphState, setGraphState] = useState(calculateDynamicPathway(baseGraph, []));

  useEffect(() => {
    setGraphState(calculateDynamicPathway(baseGraph, completedSkills));
  }, [completedSkills, baseGraph]);

  const toggleSkill = (id) => {
      setCompletedSkills(prev => {
          if (prev.includes(id)) {
              return prev.filter(s => s !== id);
          } else {
              return [...prev, id];
          }
      });
  };

  // Static baseline to compare against (if no dynamic transfer occurred)
  const staticRemaining = graphState.nodes.reduce((acc, node) => {
      if (node.completed) return acc;
      return acc + node.baseTime;
  }, 0);
  
  const timeSaved = staticRemaining - graphState.remainingTime;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Network className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dynamic Knowledge Graph</h1>
          <p className="text-muted-foreground">Graph Neural Network that recalculates optimal learning pathways in real-time, leveraging lateral knowledge transfer.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden min-h-[500px]">
            <div className="bg-slate-900 p-8 h-full flex flex-col justify-center items-center relative">
              
              <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
                  {graphState.nodes.map(node => (
                      <div 
                          key={node.id} 
                          onClick={() => toggleSkill(node.id)}
                          className={`
                              relative p-4 rounded-xl border-2 cursor-pointer transition-all min-w-[140px] text-center
                              ${node.completed 
                                  ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                  : 'bg-slate-800 border-slate-700 hover:border-violet-500/50'}
                          `}
                      >
                          <h3 className={`font-semibold ${node.completed ? 'text-emerald-400' : 'text-slate-200'}`}>
                              {node.label}
                          </h3>
                          <div className="mt-2 text-xs font-mono">
                              {node.completed ? (
                                  <span className="text-emerald-500 flex items-center justify-center gap-1">
                                      <Target className="w-3 h-3" /> Mastered
                                  </span>
                              ) : (
                                  <div className="flex flex-col gap-1">
                                      <span className="text-slate-400 line-through decoration-slate-500">
                                          {node.baseTime} hrs
                                      </span>
                                      <span className="text-violet-400 font-bold flex items-center justify-center gap-1">
                                          <Zap className="w-3 h-3" /> {node.adjustedTime} hrs
                                      </span>
                                  </div>
                              )}
                          </div>
                          
                          {/* Display connections implicitly through UI lines if this was a real canvas, for now we just show the nodes */}
                      </div>
                  ))}
              </div>

              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-4 rounded-lg shadow-lg border border-border text-xs max-w-xs">
                <p className="font-medium text-slate-300 mb-2">Lateral Knowledge Transfer</p>
                <p className="text-slate-400">As you complete prerequisite skills, the GNN automatically reduces the estimated time required for downstream dependent skills due to compounding conceptual familiarity.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-violet-500/20 shadow-sm">
            <CardHeader className="bg-violet-50 dark:bg-violet-950/20 pb-4 border-b border-violet-100 dark:border-violet-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-violet-500" />
                    Adaptive Pacing
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Static Time Remaining</label>
                      <span className="font-mono text-slate-500">{staticRemaining} hrs</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-md">
                      <label className="text-sm font-bold text-violet-700 dark:text-violet-400 flex items-center gap-2">
                          <Brain className="w-4 h-4" /> AI Adjusted Time
                      </label>
                      <span className="font-mono font-bold text-violet-600 text-lg">{graphState.remainingTime} hrs</span>
                  </div>
              </div>

            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Skill Acquisition
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground">Skills Mastered</span>
                    <span className="font-mono font-medium text-emerald-600">{completedSkills.length} / {graphState.nodes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground">Time Saved via GNN</span>
                    <span className="font-mono font-medium text-violet-600">{timeSaved} hrs</span>
                  </div>
                  
                  {timeSaved > 0 && (
                      <p className="text-xs text-violet-600 dark:text-violet-400 pt-2 font-medium leading-relaxed">
                          Your mastery of fundamental skills has triggered a cascading reduction in downstream learning time. The pathway has re-optimized to your accelerated pace.
                      </p>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
