"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { generateDynamicEnvironment, calculatePredictivePath, calculateReactivePath, getObstaclePositionAtTime } from "./_components/predictive-algorithm";
import { Clock, Cpu, Play, Square, FastForward, Activity, Map, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function DynamicRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [usePredictive, setUsePredictive] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [speed, setSpeed] = useState(300); // ms per tick
  const [agentStatus, setAgentStatus] = useState("Idle");
  const [agentPos, setAgentPos] = useState({x: 1, y: 1});

  // Grid Configuration
  const width = 20;
  const height = 15;
  const cellSize = 30;

  const start = {x: 1, y: 1};
  const target = {x: width - 2, y: height - 2};

  // Generate Environment (Static)
  const { grid, obstacles } = useMemo(() => {
    return generateDynamicEnvironment(width, height);
  }, [width, height]);

  // Handle Play/Pause
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeStep(t => t + 1);
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  // Reset Simulation
  const handleReset = () => {
    setIsPlaying(false);
    setTimeStep(0);
    setAgentPos(start);
    setAgentStatus("Idle");
  };

  // Agent movement logic per tick
  useEffect(() => {
    if (timeStep === 0) {
      setAgentPos(start);
      return;
    }

    if (agentPos.x === target.x && agentPos.y === target.y) {
      setAgentStatus("Goal Reached");
      setIsPlaying(false);
      return;
    }

    const currentObsPositions = obstacles.map(o => getObstaclePositionAtTime(o, timeStep));
    
    // Check if agent was crushed (Collision)
    const collision = currentObsPositions.some(o => o.x === agentPos.x && o.y === agentPos.y);
    if (collision) {
      setAgentStatus("Collision Detected! Agent Destroyed.");
      setIsPlaying(false);
      return;
    }

    if (usePredictive) {
      // 1. Predictive Routing (Time-Space A*)
      // The agent calculates the full future path knowing exactly where obstacles will be
      const path = calculatePredictivePath(agentPos, target, grid, obstacles, 100);
      
      if (path && path.length > 1) { // path[0] is current pos
        const nextStep = path[1];
        setAgentPos({x: nextStep.x, y: nextStep.y});
        if (nextStep.isWait) {
          setAgentStatus("Waiting for obstacle to pass...");
        } else {
          setAgentStatus("Moving along predictive route...");
        }
      } else {
        setAgentStatus("Trapped! No safe future path.");
        setIsPlaying(false);
      }
    } else {
      // 2. Reactive Routing (Standard A*)
      // The agent assumes current obstacle positions are static walls
      const path = calculateReactivePath(agentPos, target, grid, currentObsPositions);
      
      if (path && path.length > 1) {
        const nextStep = path[1];
        
        // Edge collision check (swapping places)
        const edgeCollision = obstacles.some((o, i) => {
          const prevO = getObstaclePositionAtTime(o, timeStep - 1);
          return (nextStep.x === prevO.x && nextStep.y === prevO.y && agentPos.x === o.x && agentPos.y === o.y);
        });
        
        if (edgeCollision) {
           setAgentStatus("Head-on Collision Detected!");
           setIsPlaying(false);
           return;
        }
        
        setAgentPos({x: nextStep.x, y: nextStep.y});
        setAgentStatus("Recalculating reactive route...");
      } else {
        // Reactive agent often gets stuck in corners because it can't see that the obstacle will move
        setAgentStatus("Path blocked! Waiting for clearance...");
      }
    }

  }, [timeStep]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clear
    ctx.clearRect(0, 0, width * cellSize, height * cellSize);
    
    // Draw Grid & Static Obstacles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        ctx.strokeStyle = "#1e293b"; // Slate 800
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        if (grid[y][x] === 1) {
          ctx.fillStyle = "#334155"; // Slate 700 (Wall)
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Draw Target
    ctx.fillStyle = "#10b981"; // Emerald
    ctx.fillRect(target.x * cellSize + 2, target.y * cellSize + 2, cellSize - 4, cellSize - 4);
    
    // Get full predictive path for visualization if enabled
    let fullPredictivePath = [];
    if (usePredictive && isPlaying && agentStatus !== "Goal Reached") {
       fullPredictivePath = calculatePredictivePath(agentPos, target, grid, obstacles, 100);
       
       // Draw Ghost Path
       if (fullPredictivePath && fullPredictivePath.length > 0) {
         ctx.beginPath();
         ctx.moveTo(fullPredictivePath[0].x * cellSize + cellSize/2, fullPredictivePath[0].y * cellSize + cellSize/2);
         for (let i = 1; i < fullPredictivePath.length; i++) {
           ctx.lineTo(fullPredictivePath[i].x * cellSize + cellSize/2, fullPredictivePath[i].y * cellSize + cellSize/2);
         }
         ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"; // Sky blue transparent
         ctx.lineWidth = 4;
         ctx.setLineDash([5, 5]);
         ctx.stroke();
         ctx.setLineDash([]);
         
         // Highlight wait points
         fullPredictivePath.forEach(pt => {
           if (pt.isWait) {
             ctx.fillStyle = "rgba(245, 158, 11, 0.8)"; // Amber
             ctx.beginPath();
             ctx.arc(pt.x * cellSize + cellSize/2, pt.y * cellSize + cellSize/2, cellSize/4, 0, Math.PI*2);
             ctx.fill();
           }
         });
       }
    }
    
    // Draw Dynamic Obstacles
    obstacles.forEach(obs => {
      const pos = getObstaclePositionAtTime(obs, timeStep);
      
      // Draw obstacle patrol ghost trail
      ctx.beginPath();
      ctx.moveTo(obs.path[0].x * cellSize + cellSize/2, obs.path[0].y * cellSize + cellSize/2);
      for(let i=1; i<obs.path.length; i++){
         ctx.lineTo(obs.path[i].x * cellSize + cellSize/2, obs.path[i].y * cellSize + cellSize/2);
      }
      ctx.strokeStyle = "rgba(239, 68, 68, 0.2)"; // Red transparent
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw actual obstacle (Forklift)
      ctx.fillStyle = "#ef4444"; // Red 500
      ctx.fillRect(pos.x * cellSize + 2, pos.y * cellSize + 2, cellSize - 4, cellSize - 4);
      // Warning lights
      ctx.fillStyle = "#facc15"; // Yellow
      ctx.fillRect(pos.x * cellSize + 4, pos.y * cellSize + 4, 6, 6);
    });

    // Draw Agent
    ctx.fillStyle = "#38bdf8"; // Sky Blue
    ctx.beginPath();
    ctx.arc(agentPos.x * cellSize + cellSize/2, agentPos.y * cellSize + cellSize/2, cellSize/2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [grid, obstacles, timeStep, agentPos, usePredictive, isPlaying]);

  const hasFailed = agentStatus.includes("Collision") || agentStatus.includes("Trapped");
  const hasSucceeded = agentStatus === "Goal Reached";

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spatio-Temporal Predictive Router</h1>
          <p className="text-muted-foreground">Time-Space A* pathfinding for high-density dynamic environments.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
            <CardHeader className="bg-slate-900 border-b border-slate-800 pb-4">
              <CardTitle className="text-base text-slate-200 flex items-center justify-between">
                <span>Warehouse Simulation Floor</span>
                <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 font-mono">
                  t = {timeStep}
                </Badge>
              </CardTitle>
            </CardHeader>
            <div className="p-4 flex justify-center items-center overflow-x-auto relative min-h-[500px]">
              <canvas 
                ref={canvasRef} 
                width={width * cellSize} 
                height={height * cellSize} 
                className="bg-[#0f172a] rounded shadow-inner"
              />
              
              {/* Legend */}
              <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-700 text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-400 border-2 border-white"></div> Autonomous Agent
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div> Dynamic Obstacle (Forklift)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-700 border border-slate-600"></div> Static Racking
                </div>
                {usePredictive && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div> Intentional Wait Action
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={`border shadow-sm transition-colors ${
            hasFailed ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10' : 
            hasSucceeded ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/10' : 
            'border-blue-500/20'
          }`}>
            <CardHeader className={`${
              hasFailed ? 'bg-red-100/50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/30' :
              hasSucceeded ? 'bg-emerald-100/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30' :
              'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
            } pb-4 border-b`}>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className={`w-5 h-5 ${hasFailed ? 'text-red-500' : hasSucceeded ? 'text-emerald-500' : 'text-blue-500'}`} />
                Agent Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div className={`p-3 rounded-md text-sm font-medium ${
                hasFailed ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                hasSucceeded ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' :
                'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
              }`}>
                {agentStatus}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsPlaying(!isPlaying)} 
                  variant={isPlaying ? "secondary" : "default"}
                  className={`flex-1 ${!isPlaying && !hasFailed && !hasSucceeded ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  disabled={hasFailed || hasSucceeded}
                >
                  {isPlaying ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Start Simulation"}
                </Button>
                <Button onClick={handleReset} variant="outline" className="px-3">
                  Reset
                </Button>
              </div>

            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-500" />
                Algorithm Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              
              <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="predictive-mode" className="text-sm font-semibold">Predictive Spatio-Temporal Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    If off, uses Standard Reactive A* which only looks at current obstacle positions.
                  </p>
                </div>
                <Switch 
                  id="predictive-mode" 
                  checked={usePredictive} 
                  onCheckedChange={(val) => {
                    setUsePredictive(val);
                    handleReset();
                  }} 
                  disabled={isPlaying}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="flex items-center gap-2"><FastForward className="w-4 h-4 text-muted-foreground" /> Sim Speed</span>
                  <span className="font-mono bg-muted px-2 rounded">{speed}ms</span>
                </div>
                <Slider 
                  value={[1000 - speed]} 
                  onValueChange={(val) => setSpeed(1000 - val[0])} 
                  min={100} max={950} step={50} 
                />
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
