"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateReefSites, calculateDiveProfile } from "./_components/dive-algorithm";
import { Anchor, Waves, Timer, Cylinder, AlertTriangle, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function CoralRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [numSites, setNumSites] = useState([12]);
  const [startingAir, setStartingAir] = useState([200]); // Bar
  
  const [diveResult, setDiveResult] = useState(null);

  // Generate sites once or when count changes
  const sites = useMemo(() => {
    return generateReefSites(numSites[0]);
  }, [numSites]);

  // Recalculate dive profile when inputs change
  useEffect(() => {
    const result = calculateDiveProfile(sites, startingAir[0]);
    setDiveResult(result);
  }, [sites, startingAir]);

  // Canvas config
  const width = 800;
  const height = 400;

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !diveResult) return;
    const ctx = canvas.getContext("2d");
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw Water Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#38bdf8"); // Surface (Sky blue)
    bgGradient.addColorStop(0.2, "#0ea5e9");
    bgGradient.addColorStop(1, "#0f172a"); // Deep (Navy)
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw Depth Lines (every 10m down to 40m)
    // Scale: 40m = height. So 1m = height/40 px.
    const metersToPx = height / 40;
    
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px sans-serif";
    
    for (let depth = 10; depth <= 40; depth += 10) {
      const y = depth * metersToPx;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.fillText(`${depth}m`, 10, y - 5);
    }
    ctx.setLineDash([]);
    
    // Draw Dive Profile (Time vs Depth graph)
    const profile = diveResult.profile;
    if (profile && profile.length > 0) {
      
      // Calculate X scale based on total time
      const maxTime = Math.max(30, diveResult.totalTime + 5); // At least 30 mins for scale
      const timeToPx = width / maxTime;
      
      // Fill the area under the dive profile curve
      ctx.beginPath();
      ctx.moveTo(0, 0); // Start at surface, t=0
      
      for (let i = 0; i < profile.length; i++) {
        const pt = profile[i];
        const x = pt.time * timeToPx;
        const y = Math.abs(pt.depth) * metersToPx;
        ctx.lineTo(x, y);
      }
      
      const lastX = profile[profile.length - 1].time * timeToPx;
      ctx.lineTo(lastX, 0); // Bring it back to surface
      
      ctx.fillStyle = "rgba(16, 185, 129, 0.2)"; // Emerald tint for profile area
      ctx.fill();
      
      // Draw the actual path line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 0; i < profile.length; i++) {
        const pt = profile[i];
        const x = pt.time * timeToPx;
        const y = Math.abs(pt.depth) * metersToPx;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#10b981"; // Emerald green
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw event nodes
      for (let i = 0; i < profile.length; i++) {
        const pt = profile[i];
        const x = pt.time * timeToPx;
        const y = Math.abs(pt.depth) * metersToPx;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        
        if (pt.event.includes("Coral")) {
          ctx.fillStyle = "#f59e0b"; // Amber for coral
        } else if (pt.event.includes("Safety")) {
          ctx.fillStyle = "#38bdf8"; // Blue for safety stop
        } else {
          ctx.fillStyle = "white"; // Surface
        }
        
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

  }, [diveResult]);

  const isSuccess = diveResult?.sitesPlanted === numSites[0];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
          <Anchor className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coral Reef Diver Router</h1>
          <p className="text-muted-foreground">Decompression-aware 3D pathfinding for underwater eco-restoration.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
            <CardHeader className="bg-slate-900 border-b border-slate-800 pb-4">
              <CardTitle className="text-base text-slate-200 flex items-center justify-between">
                <span>Dive Profile (Depth vs Time)</span>
                {diveResult && (
                  <Badge variant={isSuccess ? "outline" : "destructive"} className={isSuccess ? "text-emerald-500 border-emerald-500/50" : ""}>
                    {diveResult.status}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <div className="p-0 flex justify-center items-center overflow-x-auto relative">
              <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="bg-transparent"
                style={{ width: '100%', maxWidth: width, height: 'auto' }}
              />
            </div>
            
            {diveResult && (
              <div className="bg-slate-900 p-4 border-t border-slate-800 grid grid-cols-3 gap-4">
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Timer className="w-3 h-3"/> Total Bottom Time</span>
                   <span className="font-mono text-xl text-white">{diveResult.totalTime} <span className="text-sm text-slate-500">mins</span></span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Cylinder className="w-3 h-3"/> Surfacing Reserve</span>
                   <span className={`font-mono text-xl ${diveResult.remainingAirBar <= 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                     {diveResult.remainingAirBar} <span className="text-sm text-slate-500">bar</span>
                   </span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Waves className="w-3 h-3"/> Coral Fragments Planted</span>
                   <span className="font-mono text-xl text-amber-500">{diveResult.sitesPlanted} <span className="text-sm text-slate-500">/ {diveResult.totalSites}</span></span>
                 </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-emerald-500/20 shadow-sm">
            <CardHeader className="bg-emerald-50 dark:bg-emerald-950/20 pb-4 border-b border-emerald-100 dark:border-emerald-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="w-5 h-5 text-emerald-500" />
                Mission Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Waves className="w-4 h-4 text-muted-foreground" />
                    Coral Fragments
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{numSites[0]} sites</span>
                </div>
                <Slider 
                  value={numSites} 
                  onValueChange={setNumSites} 
                  min={2} max={25} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">More sites require more bottom time, risking NDL and air exhaustion.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Cylinder className="w-4 h-4 text-muted-foreground" />
                    Starting Air (AL80 Tank)
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{startingAir[0]} Bar</span>
                </div>
                <Slider 
                  value={startingAir} 
                  onValueChange={setStartingAir} 
                  min={100} max={220} step={10} 
                  className="py-2"
                />
              </div>

            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Dive Safety Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The algorithm strictly enforces scuba physics:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Sequence:</strong> Enforces the "Deepest First" heuristic.</li>
                  <li><strong>Gas Laws:</strong> Air consumption scales with ambient pressure (1 ATA per 10m).</li>
                  <li><strong>NDL:</strong> Nitrogen accumulation limits bottom time at depth.</li>
                  <li><strong>Safety Stop:</strong> Forces a mandatory 3-min decompression stop at 5 meters.</li>
                </ul>
                <p className="pt-2 text-xs italic">
                  If the router detects the NDL limit approaching or reserve air hitting 50 bar, it will immediately abort the remaining plantings and route the diver to the surface.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
