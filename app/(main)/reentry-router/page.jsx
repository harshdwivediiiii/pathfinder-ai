"use client";

import React, { useState, useEffect, useRef } from "react";
import { simulateReentryTrajectory } from "./_components/reentry-algorithm";
import { Rocket, ThermometerSun, Activity, Compass, Zap, Flame, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ReentryRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [entryAngle, setEntryAngle] = useState([-2.5]); // degrees
  const [mass, setMass] = useState([5000]); // kg
  
  const [simulationResult, setSimulationResult] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Canvas config
  const width = 800;
  const height = 400;
  const earthRadiusPx = 2500; // Fake large radius for shallow curve

  useEffect(() => {
    runSimulation();
  }, [entryAngle, mass]);

  const runSimulation = () => {
    const result = simulateReentryTrajectory(entryAngle[0], 7800, mass[0], 15);
    setSimulationResult(result);
    setAnimationStep(0);
    setIsPlaying(true);
  };

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || !simulationResult || animationStep >= simulationResult.trajectory.length - 1) {
      return;
    }
    
    const timer = setTimeout(() => {
      setAnimationStep(prev => prev + 2); // Speed up animation by skipping frames
    }, 20);
    
    return () => clearTimeout(timer);
  }, [isPlaying, animationStep, simulationResult]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !simulationResult) return;
    const ctx = canvas.getContext("2d");
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Space background
    ctx.fillStyle = "#020817";
    ctx.fillRect(0, 0, width, height);
    
    // Draw Atmosphere Layers (120km down to 0)
    // Scale: 1km = 2.5px
    const scale = 2.5;
    const surfaceY = height - 40;
    
    // Draw Earth surface curve
    ctx.beginPath();
    ctx.arc(width/2, surfaceY + earthRadiusPx, earthRadiusPx, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#3b82f6";
    ctx.stroke();
    
    // Draw Atmospheric gradient
    const atmoHeightPx = 120 * scale;
    const gradient = ctx.createLinearGradient(0, surfaceY - atmoHeightPx, 0, surfaceY);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0)"); // Space
    gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.1)"); // Mesosphere
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.4)"); // Troposphere
    
    ctx.beginPath();
    ctx.arc(width/2, surfaceY + earthRadiusPx, earthRadiusPx + atmoHeightPx, Math.PI * 1.2, Math.PI * 1.8);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw Karman Line (100km)
    ctx.beginPath();
    ctx.arc(width/2, surfaceY + earthRadiusPx, earthRadiusPx + (100 * scale), Math.PI * 1.2, Math.PI * 1.8);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px sans-serif";
    ctx.fillText("Karman Line (100km)", 20, surfaceY - (100 * scale) - 5);

    // Draw Trajectory
    const traj = simulationResult.trajectory;
    const currentStep = Math.min(animationStep, traj.length - 1);
    
    if (traj.length > 0) {
      ctx.beginPath();
      
      // Calculate X scaling to fit path in view (max distance ~ 3000km to 8000km depending on skip)
      // We'll dynamically scale X based on the total distance of the trajectory
      const maxDistance = traj[traj.length - 1].x;
      const xOffset = 50;
      const drawableWidth = width - 100;
      const xScale = drawableWidth / Math.max(2000, maxDistance);
      
      const getPoint = (pt) => {
        return {
          x: xOffset + (pt.x * xScale),
          y: surfaceY - (pt.y * scale)
        };
      };
      
      const startPt = getPoint(traj[0]);
      ctx.moveTo(startPt.x, startPt.y);
      
      // Draw path line with color based on temperature
      for (let i = 1; i <= currentStep; i++) {
        const pt = getPoint(traj[i]);
        
        // Color mapping based on temperature (0 to 2500C)
        const tempRatio = Math.min(1, traj[i].temperature / 2500);
        let color = "white"; // cold
        if (tempRatio > 0.1) color = "#fcd34d"; // yellow
        if (tempRatio > 0.5) color = "#f97316"; // orange
        if (tempRatio > 0.8) color = "#ef4444"; // red
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        
        // Start a new path for the next segment to change color
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
      }
      
      // Draw Spacecraft
      const currentPt = getPoint(traj[currentStep]);
      
      ctx.beginPath();
      ctx.arc(currentPt.x, currentPt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      
      // Draw Plasma trail if hot
      if (traj[currentStep].temperature > 500) {
        ctx.beginPath();
        ctx.moveTo(currentPt.x, currentPt.y);
        // Approximate velocity vector backwards
        const trailX = currentPt.x - 20;
        const trailY = currentPt.y - 10;
        ctx.lineTo(trailX, trailY - 5);
        ctx.lineTo(trailX, trailY + 5);
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.fill();
      }
    }
  }, [simulationResult, animationStep]);

  const getStatusColor = (outcome) => {
    switch (outcome) {
      case "Safe Landing": return "bg-emerald-500/20 text-emerald-500 border-emerald-500/50";
      case "Skipped Out": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      case "Burned Up": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "Fatal G-Force": return "bg-purple-500/20 text-purple-500 border-purple-500/50";
      default: return "bg-slate-500/20 text-slate-500";
    }
  };

  const currentData = simulationResult ? simulationResult.trajectory[Math.min(animationStep, simulationResult.trajectory.length - 1)] : null;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
          <Rocket className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planetary Re-entry Router</h1>
          <p className="text-muted-foreground">Optimize skip-reentry trajectories balancing thermal ablation and G-forces.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
            <div className="p-4 flex justify-center items-center overflow-x-auto relative">
              <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="bg-transparent rounded-md border border-slate-800"
                style={{ width: '100%', maxWidth: width, height: 'auto' }}
              />
              
              {simulationResult && (
                <div className="absolute top-6 right-6">
                  <Badge variant="outline" className={`px-3 py-1 text-sm font-bold shadow-lg ${getStatusColor(simulationResult.outcome)}`}>
                    {simulationResult.outcome}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="bg-slate-900 p-4 border-t border-slate-800 grid grid-cols-3 gap-4">
               <div className="flex flex-col">
                 <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Altitude</span>
                 <span className="font-mono text-xl text-white">{currentData ? currentData.y.toFixed(1) : 0} <span className="text-sm text-slate-500">km</span></span>
               </div>
               <div className="flex flex-col">
                 <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Velocity</span>
                 <span className="font-mono text-xl text-white">{currentData ? currentData.velocity.toFixed(0) : 0} <span className="text-sm text-slate-500">m/s</span></span>
               </div>
               <div className="flex flex-col items-end">
                 <Button 
                   variant="outline" 
                   className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
                   onClick={() => { setAnimationStep(0); setIsPlaying(true); }}
                 >
                   Replay Trajectory
                 </Button>
               </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-orange-500/20 shadow-sm">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/20 pb-4 border-b border-orange-100 dark:border-orange-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Compass className="w-5 h-5 text-orange-500" />
                Flight Corridor Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Compass className="w-4 h-4 text-muted-foreground" />
                    Entry Angle
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{entryAngle[0].toFixed(1)}°</span>
                </div>
                <Slider 
                  value={entryAngle} 
                  onValueChange={setEntryAngle} 
                  min={-6} max={-0.5} step={0.1} 
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shallow (Skip)</span>
                  <span>Steep (Burn)</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-muted-foreground" />
                    Vehicle Mass
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{mass[0]} kg</span>
                </div>
                <Slider 
                  value={mass} 
                  onValueChange={setMass} 
                  min={2000} max={15000} step={500} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Heavier vehicles penetrate deeper before drag slows them down.</p>
              </div>

            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Telemetry Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3"/> G-Force (Limit 12G)</span>
                    <span className={`font-mono font-bold ${simulationResult?.maxG > 12 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {simulationResult?.maxG.toFixed(1)} G
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden flex">
                    <div className="bg-emerald-500 h-2" style={{ width: '60%' }} />
                    <div className="bg-yellow-500 h-2" style={{ width: '20%' }} />
                    <div className="bg-red-500 h-2" style={{ width: '20%' }} />
                    
                    {simulationResult && (
                      <div 
                        className="absolute w-1 h-3 bg-white shadow-sm -mt-0.5" 
                        style={{ left: `${Math.min(100, (simulationResult.maxG / 15) * 100)}%` }} 
                      />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500"/> Heat Shield (Max 2500°C)</span>
                    <span className={`font-mono font-bold ${simulationResult?.maxTemp > 2500 ? 'text-red-500' : 'text-orange-500'}`}>
                      {simulationResult?.maxTemp.toFixed(0)} °C
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden flex relative">
                    <div className="bg-orange-300 h-2" style={{ width: '50%' }} />
                    <div className="bg-orange-500 h-2" style={{ width: '30%' }} />
                    <div className="bg-red-600 h-2" style={{ width: '20%' }} />
                    
                    {simulationResult && (
                      <div 
                        className="absolute w-1 h-3 bg-white shadow-sm -mt-0.5" 
                        style={{ left: `${Math.min(100, (simulationResult.maxTemp / 3000) * 100)}%` }} 
                      />
                    )}
                  </div>
                </div>

                {simulationResult?.outcome === "Safe Landing" && (
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Trajectory optimized. The vehicle remained within the aerodynamic corridor.
                    </p>
                  </div>
                )}
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
