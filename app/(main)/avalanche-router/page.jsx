"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateDebrisHeatmap, calculateSearchPath } from "./_components/probability-algorithm";
import { MountainSnow, Radar, Target, Timer, Compass, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function AvalancheRouterPage() {
  const canvasRef = useRef(null);
  
  // Simulation State
  const [sweepRadius, setSweepRadius] = useState([3]); // search radius (transceiver range)
  const [maxTime, setMaxTime] = useState([120]); // Max path steps (represents 15-minute window)
  
  // Results State
  const [routeResult, setRouteResult] = useState({ path: [], coverage: 0 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Grid Configuration
  const width = 60;
  const height = 40;
  const cellSize = 15; // pixels for rendering

  // Hardcoded scenario parameters
  const lastKnownPoint = { x: 30, y: 5 };
  const avalancheFlowDirection = Math.PI / 2; // Straight down
  const spreadAngle = Math.PI / 3;
  const rescuerStart = { x: 30, y: height - 5 }; // Starting at the bottom of the debris field
  
  // Generate the probability heatmap
  const debrisHeatmap = useMemo(() => {
    return generateDebrisHeatmap(width, height, lastKnownPoint, avalancheFlowDirection, spreadAngle);
  }, [width, height, lastKnownPoint, avalancheFlowDirection, spreadAngle]);

  // Recalculate optimal search route when parameters change
  useEffect(() => {
    const result = calculateSearchPath(rescuerStart, debrisHeatmap, sweepRadius[0], maxTime[0]);
    setRouteResult(result);
    setCurrentStep(0); // Reset animation
  }, [debrisHeatmap, sweepRadius, maxTime, rescuerStart]);

  // Handle Simulation Animation
  useEffect(() => {
    if (!isSimulating) return;
    
    if (currentStep < routeResult.path.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 50); // Animation speed
      return () => clearTimeout(timer);
    } else {
      setIsSimulating(false);
    }
  }, [isSimulating, currentStep, routeResult.path.length]);

  const toggleSimulation = () => {
    if (currentStep >= routeResult.path.length - 1) {
      setCurrentStep(0);
    }
    setIsSimulating(!isSimulating);
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, width * cellSize, height * cellSize);
    
    // Draw background (snow)
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width * cellSize, height * cellSize);

    // Draw Heatmap
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const prob = debrisHeatmap[y][x];
        if (prob > 0.01) {
          // Color based on probability: from light yellow to deep red
          const hue = 60 - (prob * 60); // 60 is yellow, 0 is red
          const alpha = Math.min(0.8, prob + 0.2);
          ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, height * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width * cellSize, y * cellSize);
      ctx.stroke();
    }

    // Draw Last Known Point
    ctx.fillStyle = "#3b82f6"; // Blue
    ctx.beginPath();
    ctx.arc(lastKnownPoint.x * cellSize + cellSize/2, lastKnownPoint.y * cellSize + cellSize/2, cellSize * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Path (up to current step)
    const path = routeResult.path;
    const renderSteps = isSimulating || currentStep > 0 ? currentStep : path.length - 1;
    
    if (path.length > 0) {
      ctx.strokeStyle = "#10b981"; // Emerald green path
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
      
      for (let i = 1; i <= renderSteps; i++) {
        ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Draw search coverage radius around current rescuer position
      const rescuerPos = path[renderSteps];
      ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
      ctx.beginPath();
      ctx.arc(rescuerPos.x * cellSize + cellSize/2, rescuerPos.y * cellSize + cellSize/2, sweepRadius[0] * cellSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw Rescuer Icon (Dog/Drone)
      ctx.fillStyle = "#059669";
      ctx.beginPath();
      ctx.arc(rescuerPos.x * cellSize + cellSize/2, rescuerPos.y * cellSize + cellSize/2, cellSize * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [debrisHeatmap, routeResult, currentStep, isSimulating, sweepRadius]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <MountainSnow className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avalanche Debris Search Router</h1>
          <p className="text-muted-foreground">Probability-Density Pathfinder for rapid rescue operations.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-4 flex justify-center items-center overflow-x-auto">
              <canvas 
                ref={canvasRef} 
                width={width * cellSize} 
                height={height * cellSize} 
                className="bg-white rounded-md shadow-inner"
                style={{ width: width * cellSize, height: height * cellSize }}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Search Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Radar className="w-4 h-4 text-muted-foreground" />
                    Transceiver Sweep Radius
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{sweepRadius[0]}m</span>
                </div>
                <Slider 
                  value={sweepRadius} 
                  onValueChange={setSweepRadius} 
                  min={1} max={8} step={1} 
                  className="py-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    Time Limit (Steps)
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{maxTime[0]}</span>
                </div>
                <Slider 
                  value={maxTime} 
                  onValueChange={setMaxTime} 
                  min={50} max={300} step={10} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Represents the 15-minute survival window.</p>
              </div>

              <div className="pt-4 border-t border-border">
                <Button onClick={toggleSimulation} className="w-full" size="lg" variant={isSimulating ? "destructive" : "default"}>
                  {isSimulating ? "Pause Sweep" : "Deploy Rescue Team"}
                </Button>
              </div>

            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                Coverage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Probability Covered</span>
                    <span className="font-semibold text-emerald-600">{(routeResult.coverage * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all" 
                      style={{ width: `${Math.min(100, routeResult.coverage * 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-2">
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Path Length</p>
                    <p className="text-lg font-bold font-mono">{routeResult.path.length} steps</p>
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Density</p>
                    <p className="text-lg font-bold font-mono text-orange-500">High</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
