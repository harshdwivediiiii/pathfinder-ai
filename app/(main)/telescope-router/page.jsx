"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  generateCelestialTargets, 
  optimizeObservationSequence,
  evaluateSequence 
} from "./_components/telescope-algorithm";
import { Telescope, Satellite, Orbit, Calculator, Repeat, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function TelescopeRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [targetCount, setTargetCount] = useState([25]);
  const [momentumWeight, setMomentumWeight] = useState([2.0]);
  const [targets, setTargets] = useState([]);
  
  const [randomStats, setRandomStats] = useState(null);
  const [optimizedStats, setOptimizedStats] = useState(null);
  const [activeSequence, setActiveSequence] = useState([]);
  const [isOptimizedView, setIsOptimizedView] = useState(true);

  // Canvas dimensions
  const width = 800;
  const height = 400;

  // Generate new targets on mount or when count changes
  useEffect(() => {
    generateNewTargets();
  }, [targetCount]);

  const generateNewTargets = () => {
    const newTargets = generateCelestialTargets(targetCount[0]);
    setTargets(newTargets);
    
    // Evaluate the random (unoptimized) sequence
    const rStats = evaluateSequence(newTargets);
    setRandomStats(rStats);
    
    // Calculate and evaluate the optimized sequence
    const optSequence = optimizeObservationSequence(newTargets, momentumWeight[0]);
    const oStats = evaluateSequence(optSequence);
    setOptimizedStats(oStats);
    
    setActiveSequence(isOptimizedView ? optSequence : newTargets);
  };
  
  // Recalculate if optimization weight changes
  useEffect(() => {
    if (targets.length === 0) return;
    const optSequence = optimizeObservationSequence(targets, momentumWeight[0]);
    const oStats = evaluateSequence(optSequence);
    setOptimizedStats(oStats);
    
    if (isOptimizedView) {
      setActiveSequence(optSequence);
    }
  }, [momentumWeight, targets]);
  
  const toggleView = (optimized) => {
    setIsOptimizedView(optimized);
    if (optimized && optimizedStats) {
      setActiveSequence(optimizeObservationSequence(targets, momentumWeight[0]));
    } else {
      setActiveSequence(targets);
    }
  };

  // Convert RA/Dec to Canvas X/Y (Equirectangular Projection)
  const toCanvasCoords = (ra, dec) => {
    // ra is [0, 2PI], dec is [-PI/2, PI/2]
    const x = (ra / (2 * Math.PI)) * width;
    const y = height / 2 - (dec / (Math.PI / 2)) * (height / 2);
    return { x, y };
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeSequence.length === 0) return;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw deep space background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#020617"); // Slate 950
    bgGradient.addColorStop(1, "#0f172a"); // Slate 900
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines (RA and Dec)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo((width / 8) * i, 0);
      ctx.lineTo((width / 8) * i, height);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (height / 4) * i);
      ctx.lineTo(width, (height / 4) * i);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Path
    if (activeSequence.length > 1) {
      ctx.strokeStyle = isOptimizedView ? "rgba(16, 185, 129, 0.6)" : "rgba(239, 68, 68, 0.6)"; // Emerald or Red
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      const startCoord = toCanvasCoords(activeSequence[0].ra, activeSequence[0].dec);
      ctx.moveTo(startCoord.x, startCoord.y);
      
      for (let i = 1; i < activeSequence.length; i++) {
        const coord = toCanvasCoords(activeSequence[i].ra, activeSequence[i].dec);
        
        // Handle wrapping across the 2PI boundary roughly (if distance is huge, just draw it for now or break it)
        // For visual simplicity in equirectangular, we just draw the line even if it cuts across the whole map.
        // A proper visualization would split the line, but this is sufficient for the demo.
        ctx.lineTo(coord.x, coord.y);
      }
      ctx.stroke();
    }

    // Draw Targets (Stars)
    targets.forEach((target, index) => {
      const coord = toCanvasCoords(target.ra, target.dec);
      
      // Star glow
      const gradient = ctx.createRadialGradient(coord.x, coord.y, 0, coord.x, coord.y, 6);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Target text number
      const seqIndex = activeSequence.findIndex(t => t.id === target.id);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px monospace";
      ctx.fillText(seqIndex + 1, coord.x + 8, coord.y + 4);
    });

  }, [activeSequence, targets, isOptimizedView]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Telescope className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orbital Telescope Router</h1>
          <p className="text-muted-foreground">Minimize reaction wheel momentum buildup using celestial TSP optimization.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
            <div className="p-4 flex justify-center items-center overflow-x-auto">
              <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="bg-transparent rounded-md border border-slate-800"
                style={{ width: '100%', maxWidth: width, height: 'auto' }}
              />
            </div>
            <div className="flex justify-center gap-4 p-4 border-t border-slate-800 bg-slate-900">
              <Button 
                variant={!isOptimizedView ? "default" : "outline"} 
                className={!isOptimizedView ? "bg-red-600 hover:bg-red-700 text-white" : "border-slate-700 text-slate-300"}
                onClick={() => toggleView(false)}
              >
                Random Sequence
              </Button>
              <Button 
                variant={isOptimizedView ? "default" : "outline"}
                className={isOptimizedView ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-700 text-slate-300"}
                onClick={() => toggleView(true)}
              >
                Momentum-Optimized
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-indigo-500/20 shadow-sm">
            <CardHeader className="bg-indigo-50 dark:bg-indigo-950/20 pb-4 border-b border-indigo-100 dark:border-indigo-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Orbit className="w-5 h-5 text-indigo-500" />
                Observation Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    Target Count
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{targetCount[0]} targets</span>
                </div>
                <Slider 
                  value={targetCount} 
                  onValueChange={setTargetCount} 
                  min={5} max={50} step={1} 
                  className="py-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-muted-foreground" />
                    Momentum Penalty Weight
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{momentumWeight[0].toFixed(1)}x</span>
                </div>
                <Slider 
                  value={momentumWeight} 
                  onValueChange={setMomentumWeight} 
                  min={0} max={5} step={0.5} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Higher values prioritize canceling momentum over taking the shortest path.</p>
              </div>

              <div className="pt-4 border-t border-border">
                <Button onClick={generateNewTargets} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" size="lg">
                  <Repeat className="w-4 h-4 mr-2" />
                  Generate New Targets
                </Button>
              </div>

            </CardContent>
          </Card>

          {randomStats && optimizedStats && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-indigo-500" />
                  Performance Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-2">Random Sequence</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total Angular Distance:</span>
                    <span className="font-mono">{randomStats.totalDistance.toFixed(2)} rad</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net Momentum Buildup:</span>
                    <span className="font-mono text-red-600 dark:text-red-400 font-bold">{randomStats.momentumMagnitude.toFixed(2)} units</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">Optimized Sequence</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total Angular Distance:</span>
                    <span className="font-mono">{optimizedStats.totalDistance.toFixed(2)} rad</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net Momentum Buildup:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{optimizedStats.momentumMagnitude.toFixed(2)} units</span>
                  </div>
                </div>
                
                <div className="text-xs text-center text-muted-foreground pt-2">
                  Optimized sequence reduces momentum desaturation burns by 
                  <span className="font-bold text-indigo-500 ml-1">
                    {((1 - (optimizedStats.momentumMagnitude / Math.max(0.01, randomStats.momentumMagnitude))) * 100).toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
