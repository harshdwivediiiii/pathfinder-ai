"use client";

import React, { useState } from "react";
import { TopologicalAnalyzer } from "./_components/tda-algorithm";
import { Network, Activity, Filter, RefreshCw, AlertTriangle, GitCommit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function TDABottlenecksPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const mockTelemetryData = [
    { userId: "u1", path: ["intro_js", "async_await", "react_hooks"] },
    { userId: "u2", path: ["intro_js", "async_await", "react_hooks", "redux_saga"], droppedAt: "redux_saga" },
    { userId: "u3", path: ["intro_js", "async_await", "react_hooks", "nextjs_routing"] },
    { userId: "u4", path: ["react_hooks", "redux_saga", "react_hooks", "redux_saga"], droppedAt: "redux_saga" }
  ];

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setResults(null);

    // Simulate high-dimensional computation time
    setTimeout(() => {
        try {
            const tda = new TopologicalAnalyzer();
            tda.fit(mockTelemetryData);
            const output = tda.identifyBottlenecks(0.3); // 30% churn threshold
            setResults(output);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    }, 1500);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Network className="w-10 h-10 text-orange-500" />
            TDA Bottleneck Analysis
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Identify structural churn and topological holes in complex learning pathways.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-orange-500/20 shadow-lg shadow-orange-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Curriculum Simplicial Complex
              </CardTitle>
              <CardDescription>Visualizing high-dimensional learner manifolds</CardDescription>
            </CardHeader>
            <CardContent className="p-12 flex justify-center items-center bg-[#0a0a0a] min-h-[400px] relative overflow-hidden rounded-b-xl">
                {isAnalyzing ? (
                    <div className="text-center text-orange-500">
                        <RefreshCw className="w-16 h-16 animate-spin mx-auto mb-4" />
                        <p className="font-mono text-sm animate-pulse">Computing Persistent Homology...</p>
                    </div>
                ) : results ? (
                    <div className="w-full max-w-md relative">
                        {/* Simulated nodes for UI purposes */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-8 w-full">
                            <div className="p-3 bg-gray-800 text-white rounded-lg border border-gray-600 font-mono text-xs shadow-lg z-10 w-32 text-center">intro_js</div>
                            <div className="h-8 w-px bg-gray-600 -my-8"></div>
                            <div className="p-3 bg-gray-800 text-white rounded-lg border border-gray-600 font-mono text-xs shadow-lg z-10 w-32 text-center">react_hooks</div>
                            
                            <div className="flex justify-between w-full px-8 -my-4 relative">
                                {/* Left Branch (Bottleneck) */}
                                <div className="flex flex-col items-center">
                                    <div className="h-16 w-px bg-orange-500/50 rotate-45 absolute left-1/4 top-0 origin-top"></div>
                                    <div className="p-3 bg-red-900/50 text-red-400 rounded-lg border-2 border-red-500 font-mono text-xs shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10 w-32 text-center mt-12 animate-pulse">
                                        redux_saga
                                        <AlertTriangle className="w-4 h-4 mx-auto mt-1" />
                                    </div>
                                </div>
                                {/* Right Branch */}
                                <div className="flex flex-col items-center">
                                    <div className="h-16 w-px bg-gray-600 -rotate-45 absolute right-1/4 top-0 origin-top"></div>
                                    <div className="p-3 bg-gray-800 text-white rounded-lg border border-gray-600 font-mono text-xs shadow-lg z-10 w-32 text-center mt-12">
                                        nextjs_routing
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground/50">
                        <Network className="w-24 h-24 mx-auto mb-4 opacity-20" />
                        <p>Feed telemetry data into the TDA engine to render the manifold.</p>
                    </div>
                )}
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 transition-all shadow-md hover:shadow-lg h-14 text-lg font-semibold"
          >
            <Filter className="w-5 h-5" />
            {isAnalyzing ? "Extracting Topology..." : "Run TDA on Telemetry"}
          </Button>
        </div>

        <div className="space-y-6">
            <Card className="h-full border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitCommit className="w-5 h-5" />
                        Structural Insights
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!results && (
                        <p className="text-center text-muted-foreground py-8">Analysis pending...</p>
                    )}

                    {results && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Identified Bottlenecks</h3>
                                <div className="space-y-3">
                                    {results.bottlenecks.map(b => (
                                        <div key={b.id} className="p-3 border border-red-500/30 bg-red-500/10 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-mono text-sm text-red-500 font-bold">{b.id}</span>
                                                <span className="text-xs text-red-400 font-semibold">Churn: {(b.churnRate * 100).toFixed(0)}%</span>
                                            </div>
                                            <Progress value={b.churnRate * 100} className="h-1.5 [&>div]:bg-red-500 bg-red-950" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {results.structuralHoles.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Anomalous Learning Loops</h3>
                                    {results.structuralHoles.map((hole, idx) => (
                                        <div key={idx} className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex gap-3 items-start">
                                            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-orange-200">Betti-1 Hole Detected</p>
                                                <p className="text-xs text-orange-200/70 mt-1 leading-relaxed">
                                                    {hole.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="p-4 bg-secondary/30 rounded-lg border">
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Topology Metrics</h4>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-mono text-foreground">{results.bettiNumbers.b0}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Betti 0 (Components)</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-mono text-foreground">{results.bettiNumbers.b1}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Betti 1 (Holes)</div>
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
