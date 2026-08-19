"use client";

import React, { useState, useEffect } from "react";
import { SwarmIntelligenceCurriculum } from "./_components/aco-algorithm";
import { Bug, Map, ArrowRight, Route, GitFork, RefreshCcw, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SwarmIntelligencePage() {
  const [aco, setAco] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [edges, setEdges] = useState([]);
  const [recommendedPath, setRecommendedPath] = useState([]);

  // Initial Graph Setup
  const initialNodes = ['HTML', 'CSS', 'JS', 'React', 'Vue', 'Node', 'Python'];
  const initialEdges = [
    { source: 'HTML', target: 'CSS' },
    { source: 'CSS', target: 'JS' },
    { source: 'JS', target: 'React' },
    { source: 'JS', target: 'Vue' },
    { source: 'React', target: 'Node' },
    { source: 'Vue', target: 'Python' }
  ];

  useEffect(() => {
    const system = new SwarmIntelligenceCurriculum(initialNodes, initialEdges);
    setAco(system);
    setEdges(system.edges);
    setRecommendedPath(system.getRecommendedPath('HTML'));
  }, []);

  const handleSimulateCycle = () => {
    if (!aco) return;
    setIsSimulating(true);

    // Simulate 100 users (ants) exploring the graph
    // We intentionally skew success towards the React -> Node path
    setTimeout(() => {
        const traversals = Array.from({ length: 100 }).map(() => {
            const isReactPath = Math.random() > 0.3; // 70% go React
            return {
                success: Math.random() > (isReactPath ? 0.2 : 0.6), // React path has 80% success, Vue path has 40% success
                path: isReactPath 
                    ? ['HTML', 'CSS', 'JS', 'React', 'Node'] 
                    : ['HTML', 'CSS', 'JS', 'Vue', 'Python']
            };
        });

        const newEdges = aco.simulateSwarmCycle(traversals);
        setEdges(newEdges);
        setRecommendedPath(aco.getRecommendedPath('HTML'));
        setCycle(prev => prev + 1);
        setIsSimulating(false);
    }, 800);
  };

  const getEdgeThickness = (pheromone) => {
    // Baseline is 1.0. Max theoretical is unbounded, but typically balances around 5-10
    const val = Math.min(Math.max(1, pheromone), 8);
    return `${val}px`;
  };

  const getEdgeColor = (pheromone) => {
    if (pheromone > 4) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'; // Strong trail
    if (pheromone > 1.5) return 'bg-emerald-500/60'; // Weak trail
    return 'bg-gray-700'; // Evaporated trail
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Bug className="w-10 h-10 text-emerald-500" />
            ACO Swarm Curriculum
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Ant Colony Optimization dynamically shifting pathway recommendations based on collective success.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Map className="w-5 h-5" /> Knowledge Graph</span>
                  <span className="text-sm font-mono text-emerald-500">Cycle: {cycle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-12 min-h-[400px] flex items-center justify-center relative bg-[#0a0a0a] rounded-b-xl overflow-hidden">
                {/* Simulated Graph Layout */}
                <div className="relative w-full max-w-md h-64">
                    {/* Nodes */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 font-mono text-sm z-10">HTML</div>
                    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 font-mono text-sm z-10">CSS</div>
                    <div className="absolute top-1/2 left-2/4 -translate-y-1/2 px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 font-mono text-sm z-10">JS</div>
                    
                    <div className="absolute top-1/4 left-3/4 -translate-y-1/2 px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 font-mono text-sm z-10">React</div>
                    <div className="absolute top-3/4 left-3/4 -translate-y-1/2 px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 font-mono text-sm z-10">Vue</div>

                    <div className="absolute top-1/4 right-0 -translate-y-1/2 px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 font-mono text-sm z-10">Node</div>
                    <div className="absolute top-3/4 right-0 -translate-y-1/2 px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 font-mono text-sm z-10">Python</div>

                    {/* Edges (Pheromone Trails) */}
                    {edges.map(edge => {
                        let styling = {};
                        if (edge.source === 'HTML' && edge.target === 'CSS') styling = { left: '48px', top: '50%', width: 'calc(25% - 48px)', transform: 'translateY(-50%)' };
                        if (edge.source === 'CSS' && edge.target === 'JS') styling = { left: 'calc(25% + 40px)', top: '50%', width: 'calc(25% - 40px)', transform: 'translateY(-50%)' };
                        
                        // Bifurcation
                        if (edge.source === 'JS' && edge.target === 'React') styling = { left: 'calc(50% + 32px)', top: '50%', width: '25%', transformOrigin: 'left center', transform: 'translateY(-50%) rotate(-45deg)' };
                        if (edge.source === 'JS' && edge.target === 'Vue') styling = { left: 'calc(50% + 32px)', top: '50%', width: '25%', transformOrigin: 'left center', transform: 'translateY(-50%) rotate(45deg)' };
                        
                        if (edge.source === 'React' && edge.target === 'Node') styling = { left: 'calc(75% + 56px)', top: '25%', width: 'calc(25% - 56px)', transform: 'translateY(-50%)' };
                        if (edge.source === 'Vue' && edge.target === 'Python') styling = { left: 'calc(75% + 44px)', top: '75%', width: 'calc(25% - 44px)', transform: 'translateY(-50%)' };

                        return (
                            <div 
                                key={edge.id}
                                className={`absolute transition-all duration-1000 ${getEdgeColor(edge.pheromone)}`}
                                style={{ ...styling, height: getEdgeThickness(edge.pheromone) }}
                                title={`Pheromone: ${edge.pheromone}`}
                            />
                        )
                    })}
                </div>
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            onClick={handleSimulateCycle} 
            disabled={isSimulating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all shadow-md hover:shadow-lg h-14 text-lg font-semibold"
          >
            {isSimulating ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <GitFork className="w-5 h-5" />}
            {isSimulating ? "Simulating Swarm Traversals..." : "Simulate 100 User Traversals"}
          </Button>
        </div>

        <div className="space-y-6">
            <Card className="h-full border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Route className="w-5 h-5" />
                        Emergent Curriculum
                    </CardTitle>
                    <CardDescription>Dynamically generated path</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {cycle === 0 && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 text-yellow-600 dark:text-yellow-500">
                            <Activity className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">Graph is currently balanced. Simulate traversals to let the ACO algorithm discover the optimal path.</p>
                        </div>
                    )}
                    
                    <div className="space-y-3 p-4 bg-secondary/30 rounded-xl border relative">
                        <div className="absolute top-0 left-6 bottom-0 w-px bg-emerald-500/20"></div>
                        {recommendedPath.map((node, i) => (
                            <div key={node} className="flex items-center gap-4 relative z-10 animate-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms`}}>
                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-background"></div>
                                <span className="font-mono font-bold">{node}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Pheromone Levels (Internal)</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {edges.map(e => (
                                <div key={e.id} className="flex justify-between items-center p-2 rounded bg-muted/50 border text-sm">
                                    <span className="font-mono">{e.source} <ArrowRight className="w-3 h-3 inline text-muted-foreground" /> {e.target}</span>
                                    <span className={`font-mono font-bold ${e.pheromone > 1.5 ? 'text-emerald-500' : 'text-muted-foreground'}`}>{e.pheromone.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
