"use client";

import React, { useState, useEffect } from "react";
import { DifferentialPrivacyEngine } from "./_components/privacy-algorithm";
import { ShieldCheck, Trophy, Lock, BarChart3, EyeOff, Activity, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DifferentialPrivacyPage() {
  const [epsilon, setEpsilon] = useState(1.0); // 1.0 is a standard starting point for DP
  const [engine, setEngine] = useState(new DifferentialPrivacyEngine(epsilon));
  const [rawDataset, setRawDataset] = useState([]);
  const [anonymizedData, setAnonymizedData] = useState([]);
  const [privacyMetrics, setPrivacyMetrics] = useState(null);

  // Generate a mock dataset of 20 users
  useEffect(() => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
          id: `u${i}`,
          username: `user_real_${i}`,
          score: Math.floor(Math.random() * 800) + 200 // Scores between 200 and 1000
      }));
      
      // Sort raw data by actual score for comparison
      mockData.sort((a, b) => b.score - a.score);
      setRawDataset(mockData);
  }, []);

  // Re-run DP algorithm when epsilon changes or data loads
  useEffect(() => {
      if (rawDataset.length > 0) {
          const newEngine = new DifferentialPrivacyEngine(epsilon);
          setEngine(newEngine);
          
          try {
              // Using a sensitivity of 100 (assuming a single module completion is max 100 points)
              const noisy = newEngine.anonymizeLeaderboard(rawDataset, 100);
              setAnonymizedData(noisy);
              setPrivacyMetrics(newEngine.calculatePrivacyMetrics(rawDataset, 100));
          } catch (e) {
              console.error(e);
          }
      }
  }, [epsilon, rawDataset]);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-cyan-500" />
            Differential Privacy Leaderboards
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Calibrate cryptographic noise to protect user data while maintaining competitive gamification.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl shadow-inner min-w-[200px]">
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Privacy Budget (ε)</p>
                    <p className="text-lg font-bold text-cyan-600">{epsilon.toFixed(1)}</p>
                </div>
                <input 
                    type="range" 
                    min="0.1" 
                    max="5.0" 
                    step="0.1" 
                    value={epsilon} 
                    onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                    <span>High Privacy</span>
                    <span>High Accuracy</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RAW DATA - HIDDEN FROM PUBLIC */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-dashed border-red-500/30 bg-red-500/5 h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" /> Raw Database (Private)
              </CardTitle>
              <CardDescription>Exact scores. Never exposed to clients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-auto custom-scrollbar">
                {rawDataset.map((user, idx) => (
                    <div key={user.id} className="flex justify-between items-center p-2 rounded bg-background border shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                            <span className="text-sm font-mono">{user.username}</span>
                        </div>
                        <span className="text-sm font-bold">{user.score} pt</span>
                    </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* DP ALGORITHM METRICS */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="border-cyan-500/20 shadow-lg h-full flex flex-col">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-500" />
                        Laplace Mechanism
                    </CardTitle>
                    <CardDescription>Algorithm configuration metrics</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-center">
                    
                    <div className="bg-background border rounded-xl p-4 shadow-inner space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">Epsilon (ε)</span>
                            <span className="font-bold text-cyan-600">{privacyMetrics?.epsilon.toFixed(1)}</span>
                        </div>
                        <div className="w-full h-px bg-border"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">Sensitivity (Δf)</span>
                            <span className="font-mono text-xs">100 points</span>
                        </div>
                        <div className="w-full h-px bg-border"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">Theoretical Scale (b)</span>
                            <span className="font-mono text-xs text-orange-500">±{privacyMetrics?.theoreticalScale.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-px bg-border"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">Avg. Noise Injected</span>
                            <span className="font-bold text-red-500">~{privacyMetrics?.averageNoiseAdded.toFixed(1)} pts</span>
                        </div>
                    </div>

                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-sm text-cyan-700 dark:text-cyan-400">
                        <p className="font-semibold flex items-center gap-2 mb-2"><Lock className="w-4 h-4"/> Mathematical Guarantee</p>
                        <p className="text-xs leading-relaxed">
                            An adversary cannot determine whether any specific individual is in the dataset, even if they possess auxiliary background information, because the output probability distribution shifts by at most e^{epsilon}.
                        </p>
                    </div>

                </CardContent>
            </Card>
        </div>

        {/* PUBLIC LEADERBOARD */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="border-green-500/30 shadow-xl h-full">
                <CardHeader className="bg-green-500/5 border-b pb-4">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Trophy className="w-5 h-5 text-green-500" /> Public Leaderboard</span>
                        <EyeOff className="w-4 h-4 text-green-500 opacity-50" />
                    </CardTitle>
                    <CardDescription>Cryptographically anonymized for clients.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4 max-h-[600px] overflow-auto custom-scrollbar relative">
                    
                    {anonymizedData.map((user, idx) => {
                        // Highlight rank shifts
                        const rawRank = rawDataset.findIndex(r => r.id === user.id) + 1;
                        const rankShift = rawRank - user.approximateRank;

                        return (
                            <div key={user.id} className="p-3 rounded-lg bg-background border flex flex-col gap-2 hover:border-green-500/50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold w-5 text-center ${idx < 3 ? 'text-green-500' : 'text-muted-foreground'}`}>{idx + 1}</span>
                                        <span className="font-mono text-sm">{user.username}</span>
                                    </div>
                                    <span className="font-bold text-green-600">{user.noisyScore}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase font-bold tracking-wider">
                                        {user.percentileTier}
                                    </span>
                                    <span className={`font-mono ${rankShift > 0 ? 'text-green-500' : rankShift < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        {rankShift !== 0 ? `Shift: ${rankShift > 0 ? '+' : ''}${rankShift}` : 'No shift'}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
