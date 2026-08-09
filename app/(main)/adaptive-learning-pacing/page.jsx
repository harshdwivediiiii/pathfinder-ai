"use client";

import React, { useState } from "react";
import { calculateMasteryBKT, prunePathway } from "./_components/bkt-algorithm";
import { Brain, FastForward, Calculator, ListTree, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdaptiveLearningPacingPage() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [bktResult, setBktResult] = useState(null);
  const [pathwayResult, setPathwayResult] = useState(null);

  // Mock a sequence of 5 initial diagnostic quiz answers (e.g. 4 correct, 1 wrong)
  const quizSequence = [true, true, false, true, true];
  
  // Standard full-length curriculum
  const defaultPathway = [
      { id: "mod_1", title: "What is JavaScript?", isBeginner: true },
      { id: "mod_2", title: "Variables & Data Types", isBeginner: true },
      { id: "mod_3", title: "ES6 Arrow Functions", isBeginner: false },
      { id: "mod_4", title: "Promises & Async/Await", isBeginner: false }
  ];

  const handleOptimize = () => {
      setIsCalculating(true);
      setBktResult(null);
      setPathwayResult(null);
      
      setTimeout(() => {
          // BKT Parameters: Prior(0.4), Learn(0.15), Guess(0.2), Slip(0.1)
          const bkt = calculateMasteryBKT(0.4, 0.15, 0.2, 0.1, quizSequence);
          setBktResult(bkt);
          
          // If probability > 85%, prune the beginner modules
          const optimized = prunePathway(bkt.masteryProbability, 0.85, defaultPathway);
          setPathwayResult(optimized);
          
          setIsCalculating(false);
      }, 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI-Driven Adaptive Pacing</h1>
          <p className="text-muted-foreground">Utilize Bayesian Knowledge Tracing (BKT) to dynamically prune redundant modules for fast learners.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: BKT Diagnostic Data */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Calculator className="w-5 h-5 text-indigo-500" />
                 Bayesian Inference Engine
              </CardTitle>
              <CardDescription>Real-time mastery assessment.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-8">
              
              <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Diagnostic Quiz Sequence</h3>
                  <div className="flex gap-2">
                      {quizSequence.map((res, i) => (
                          <div key={i} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border ${res ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'}`}>
                              {res ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" /> : <XCircle className="w-5 h-5 text-rose-500 mb-1" />}
                              <span className="text-xs font-mono">{i+1}</span>
                          </div>
                      ))}
                  </div>
              </div>
              
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg text-indigo-800 dark:text-indigo-300">
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> BKT Evaluation
                  </h4>
                  <p className="text-sm opacity-90">
                      Standard platforms force users to complete the entire default pathway regardless of prior knowledge. By feeding quiz arrays into a BKT algorithm, we probabilistically calculate actual mastery to respect the user's time.
                  </p>
              </div>
              
              <Button 
                  onClick={handleOptimize} 
                  disabled={isCalculating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12"
              >
                  {isCalculating ? (
                      <>
                          <Brain className="w-5 h-5 mr-2 animate-pulse" /> Tracing Knowledge State...
                      </>
                  ) : (
                      <>
                          <FastForward className="w-5 h-5 mr-2" /> Calculate & Optimize Pacing
                      </>
                  )}
              </Button>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Optimized Pathway Output */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                 <ListTree className="w-5 h-5 text-emerald-400" />
                 Optimized Curriculum
              </CardTitle>
              <CardDescription className="text-slate-400">Dynamically pruned based on mastery.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              
              {!bktResult && !isCalculating && (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                      <ListTree className="w-12 h-12 mb-4 opacity-50" />
                      <p>Run the Bayesian Engine to generate a pathway...</p>
                  </div>
              )}
              
              {isCalculating && (
                  <div className="text-center flex flex-col items-center text-indigo-400">
                      <Calculator className="w-16 h-16 animate-pulse mb-4 opacity-80" />
                      <p className="animate-pulse text-sm font-mono">Updating Bayesian priors and pruning graph...</p>
                  </div>
              )}
              
              {bktResult && pathwayResult && !isCalculating && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                      
                      {/* BKT Score Display */}
                      <div className="text-center p-4 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
                          <div className={`absolute top-0 left-0 h-1 w-full ${pathwayResult.action === 'accelerate' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          <h3 className="text-sm font-semibold text-slate-400 mb-1">Calculated Knowledge Mastery</h3>
                          <div className="text-4xl font-black text-white mb-2">{(bktResult.masteryProbability * 100).toFixed(1)}%</div>
                          <p className={`text-sm font-bold ${pathwayResult.action === 'accelerate' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {pathwayResult.message}
                          </p>
                      </div>
                      
                      {/* Pathway Graph */}
                      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                          
                          {pathwayResult.newPathway.map((mod, idx) => (
                              <div key={mod.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-950 bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                      <span className="font-bold text-sm">{idx + 1}</span>
                                  </div>
                                  
                                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-800 bg-slate-900 shadow">
                                      <h3 className="font-bold text-slate-200">{mod.title}</h3>
                                      {mod.isBeginner ? (
                                          <span className="text-xs text-amber-500 uppercase tracking-wider">Beginner Module</span>
                                      ) : (
                                          <span className="text-xs text-fuchsia-400 uppercase tracking-wider">Advanced Core</span>
                                      )}
                                  </div>
                              </div>
                          ))}
                          
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
