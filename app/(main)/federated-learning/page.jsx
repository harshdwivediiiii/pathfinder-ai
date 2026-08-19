"use client";

import React, { useState } from "react";
import { trainLocalModel, aggregateGlobalModel } from "./_components/federated-algorithm";
import { Shield, Smartphone, Server, UploadCloud, Lock, CheckCircle2, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FederatedLearningPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [localWeights, setLocalWeights] = useState(null);
  const [isAggregating, setIsAggregating] = useState(false);
  const [globalModel, setGlobalModel] = useState(null);

  // Mock highly sensitive user telemetry that should NEVER leave the device
  const sensitiveUserTelemetry = {
      userId: 'client_7749',
      struggleTimeMinutes: 45,
      quizScore: 30, // Failed
      hintsUsed: 8,
      anxietyMarkers: true // Highly sensitive
  };

  const runLocalTraining = () => {
      setIsTraining(true);
      
      // Simulate edge-device training time
      setTimeout(() => {
          const weights = trainLocalModel(sensitiveUserTelemetry);
          setLocalWeights(weights);
          setIsTraining(false);
      }, 1500);
  };
  
  const uploadAndAggregate = () => {
      setIsAggregating(true);
      
      // Simulate uploading weights to server and running FedAvg
      setTimeout(() => {
          // Mocking other users' weights already on the server
          const otherClients = [
              { modelWeights: [0.2, 0.4, 0.1] },
              { modelWeights: [0.8, 0.9, 0.7] },
              { modelWeights: [0.5, 0.5, 0.5] }
          ];
          
          const aggregated = aggregateGlobalModel([...otherClients, localWeights]);
          setGlobalModel(aggregated);
          setIsAggregating(false);
      }, 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
          <Shield className="w-8 h-8 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy-Preserving Federated Learning</h1>
          <p className="text-muted-foreground">Train AI models locally on edge devices. Only share anonymized mathematical weights, never raw user data.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: Local Edge Device */}
        <div className="space-y-6">
          <Card className="border-teal-500/30 shadow-sm h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Smartphone className="w-32 h-32" />
            </div>
            
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b relative z-10">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Smartphone className="w-5 h-5 text-teal-500" />
                 Local User Device (Edge)
              </CardTitle>
              <CardDescription>All raw data remains securely on this device.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6 relative z-10">
              
              <div className="p-4 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-lg">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-rose-800 dark:text-rose-400 mb-3">
                      <Lock className="w-4 h-4" /> Sensitive Raw Telemetry
                  </h4>
                  <pre className="text-xs font-mono text-rose-700 dark:text-rose-300 whitespace-pre-wrap">
                      {JSON.stringify(sensitiveUserTelemetry, null, 2)}
                  </pre>
              </div>
              
              <Button 
                  onClick={runLocalTraining} 
                  disabled={isTraining || localWeights}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                  {isTraining ? "Training Local Model..." : "Train Model Locally"}
              </Button>
              
              {localWeights && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 rounded-lg animate-in fade-in">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-400 mb-3">
                          <CheckCircle2 className="w-4 h-4" /> Generated Model Weights
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">Mathematical representation, completely stripped of PII.</p>
                      <div className="flex gap-2 font-mono text-sm text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 p-2 rounded border border-emerald-100 dark:border-emerald-900/50">
                          [{localWeights.modelWeights.map(w => w.toFixed(3)).join(', ')}]
                      </div>
                      
                      <Button 
                          onClick={uploadAndAggregate}
                          disabled={isAggregating || globalModel}
                          variant="outline"
                          className="w-full mt-4 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50"
                      >
                          {isAggregating ? "Uploading via TLS..." : <><UploadCloud className="w-4 h-4 mr-2" /> Upload Weights to Server</>}
                      </Button>
                  </div>
              )}
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Central Server */}
        <div className="space-y-6">
          <Card className="border-indigo-500/30 shadow-sm h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Server className="w-32 h-32" />
            </div>
            
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b relative z-10">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Server className="w-5 h-5 text-indigo-500" />
                 Central Cloud Server
              </CardTitle>
              <CardDescription>Federated Averaging (FedAvg) Hub</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6 relative z-10">
              
              {!globalModel && !isAggregating && (
                  <div className="h-full min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
                      <Network className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                      <p>Awaiting client weight uploads.</p>
                      <p className="text-sm">Server does not and will never possess raw user telemetry.</p>
                  </div>
              )}
              
              {isAggregating && (
                  <div className="h-full min-h-[200px] border rounded-xl flex flex-col items-center justify-center p-8 text-center bg-card">
                      <div className="relative w-20 h-20 mb-6">
                          <Server className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 z-10" />
                          <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full animate-ping opacity-75"></div>
                          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-l-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Executing FedAvg Algorithm</h3>
                      <p className="text-sm text-muted-foreground animate-pulse">Averaging weights from 4 edge devices...</p>
                  </div>
              )}
              
              {globalModel && !isAggregating && (
                  <div className="space-y-4 animate-in zoom-in-95 duration-500">
                      <div className="p-6 rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-900/30 text-center">
                          <Shield className="w-12 h-12 mx-auto mb-4 text-indigo-500" />
                          <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-2">Global Model Updated!</h3>
                          <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-6">
                              The pathway recommendation engine has successfully learned from the user's struggle patterns without ever seeing their PII.
                          </p>
                          
                          <div className="text-left space-y-2">
                              <span className="text-xs font-semibold text-indigo-500 uppercase">New Global Weights</span>
                              <div className="p-3 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-indigo-900/50 font-mono text-indigo-800 dark:text-indigo-300 flex justify-center gap-4">
                                  {globalModel.map((w, i) => (
                                      <span key={i} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded">
                                          W{i+1}: {w}
                                      </span>
                                  ))}
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
