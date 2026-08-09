"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getBasePathways, simulateMarketScrape, calculateDynamicScores } from "./_components/trend-algorithm";
import { TrendingUp, Database, ArrowUpRight, Code, BarChart, Server, Sparkles, BrainCircuit, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function JobMarketTrendsPage() {
  const basePathways = useMemo(() => getBasePathways(), []);
  
  const [trendBias, setTrendBias] = useState('baseline');
  const [pathways, setPathways] = useState(basePathways.map(p => ({ ...p, dynamicScore: p.baseScore, boost: 0 })));
  const [topKeyword, setTopKeyword] = useState('');

  useEffect(() => {
    if (trendBias === 'baseline') {
        setPathways(basePathways.map(p => ({ ...p, dynamicScore: p.baseScore, boost: 0 })).sort((a,b) => b.dynamicScore - a.dynamicScore));
        setTopKeyword('N/A');
        return;
    }
    
    // Simulate pipeline run
    const tf = simulateMarketScrape(trendBias);
    const updated = calculateDynamicScores(basePathways, tf);
    setPathways(updated);
    
    // Find highest frequency term for UI
    let highestKw = '';
    let highestVal = 0;
    Object.keys(tf).forEach(k => {
        if (tf[k] > highestVal) {
            highestVal = tf[k];
            highestKw = k;
        }
    });
    setTopKeyword(highestKw.toUpperCase());
    
  }, [trendBias, basePathways]);

  const getIconForPathway = (id) => {
      switch(id) {
          case 'frontend': return <Code className="w-5 h-5 text-blue-500" />;
          case 'backend': return <Server className="w-5 h-5 text-emerald-500" />;
          case 'data': return <BarChart className="w-5 h-5 text-violet-500" />;
          case 'ai': return <Sparkles className="w-5 h-5 text-amber-500" />;
          case 'devops': return <Database className="w-5 h-5 text-cyan-500" />;
          default: return <Code className="w-5 h-5" />;
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <TrendingUp className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Job Market Integration</h1>
          <p className="text-muted-foreground">NLP pipeline that ingests global job portals to dynamically weight career pathways based on live TF-IDF keyword demand.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Pipeline Controls */}
        <div className="space-y-6">
          <Card className="border-amber-500/20 shadow-sm">
            <CardHeader className="bg-amber-50 dark:bg-amber-950/20 pb-4 border-b border-amber-100 dark:border-amber-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Globe className="w-5 h-5 text-amber-500" />
                 Global Scraper Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Simulate Market Condition</label>
                  <Select value={trendBias} onValueChange={setTrendBias}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baseline">Static Baseline (No Scrape)</SelectItem>
                      <SelectItem value="ai_boom">Generative AI Boom</SelectItem>
                      <SelectItem value="cloud_migration">Enterprise Cloud Migration</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-slate-300">
                      <BrainCircuit className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium">TF-IDF Extractor Status</span>
                  </div>
                  
                  <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                          <span>Jobs Processed</span>
                          <span className="font-mono text-slate-200">
                              {trendBias === 'baseline' ? '0' : '45,291 (Last 24h)'}
                          </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                          <span>Top Extracted N-Gram</span>
                          <span className="font-mono text-amber-400 font-bold">
                              {topKeyword}
                          </span>
                      </div>
                  </div>
              </div>

            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Dynamic Ranking Results */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm min-h-[500px]">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <div>Dynamic Pathway Rankings</div>
                {trendBias !== 'baseline' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 flex gap-1 items-center">
                        <TrendingUp className="w-3 h-3" /> Live Weights Applied
                    </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="space-y-4">
                  {pathways.map((pathway, index) => (
                      <div key={pathway.id} className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors flex flex-col md:flex-row md:items-center gap-4">
                          
                          <div className="flex items-center gap-4 w-48 shrink-0">
                              <div className="flex items-center justify-center w-8 h-8 font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md">
                                  #{index + 1}
                              </div>
                              <div className="flex items-center gap-2">
                                  {getIconForPathway(pathway.id)}
                                  <span className="font-semibold text-sm">{pathway.title}</span>
                              </div>
                          </div>
                          
                          <div className="flex-grow space-y-2">
                              <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Demand Score</span>
                                  <span className="font-mono font-bold">{pathway.dynamicScore}</span>
                              </div>
                              <Progress value={pathway.dynamicScore} className="h-2" />
                          </div>
                          
                          <div className="w-24 shrink-0 flex justify-end">
                              {pathway.boost > 0 ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-900/50 flex gap-1">
                                      <ArrowUpRight className="w-3 h-3" />
                                      +{pathway.boost}
                                  </Badge>
                              ) : (
                                  <span className="text-xs text-muted-foreground font-mono">No change</span>
                              )}
                          </div>
                          
                      </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
