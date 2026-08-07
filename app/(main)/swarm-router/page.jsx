"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateSwarmEnvironment, calculateIndependentPaths, calculateMAPF } from "./_components/swarm-algorithm";
import { Network, Play, Square, Activity, Users, TriangleAlert, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SwarmRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [useCooperative, setUseCooperative] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState("Idle");
  
  // Current positions of agents { id: {x, y} }
  const [agentPositions, setAgentPositions] = useState({});

  // Grid Configuration
  const width = 15;
  const height = 15;
  const cellSize = 30;

  // Setup Environment
  const { grid, agents } = useMemo(() => {
    return generateSwarmEnvironment();
  }, []);

  // Calculate Paths
  const allPaths = useMemo(() => {
    if (useCooperative) {
      return calculateMAPF(agents, grid);
    } else {
      return calculateIndependentPaths(agents, grid);
    }
  }, [useCooperative, agents, grid]);

  // Determine max time steps across all paths
  const maxSimulationTime = useMemo(() => {
    let maxT = 0;
    for (const key in allPaths) {
      if (allPaths[key] && allPaths[key].length > maxT) {
        maxT = allPaths[key].length;
      }
    }
    return maxT;
  }, [allPaths]);

  // Handle Play/Pause
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeStep(t => t + 1);
      }, 400); // 400ms per tick
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Reset function
  const handleReset = () => {
    setIsPlaying(false);
    setTimeStep(0);
    
    // Reset positions to start
    const initialPos = {};
    agents.forEach(a => {
      initialPos[a.id] = { ...a.start };
    });
    setAgentPositions(initialPos);
    setSimulationStatus("Idle");
  };

  // Initialize positions on mount
  useEffect(() => {
    handleReset();
  }, [agents, useCooperative]); // Reset when mode changes

  // Simulation Logic per tick
  useEffect(() => {
    if (timeStep === 0) return;

    if (timeStep >= maxSimulationTime && maxSimulationTime > 0) {
      setSimulationStatus("All Agents Reached Goal (Success)");
      setIsPlaying(false);
      return;
    }

    const newPositions = { ...agentPositions };
    let hasCollision = false;

    // 1. Move agents based on their calculated paths
    agents.forEach(agent => {
      const path = allPaths[agent.id];
      if (path && timeStep < path.length) {
        newPositions[agent.id] = path[timeStep];
      } else if (path && path.length > 0) {
        // Agent finished, stay at last position
        newPositions[agent.id] = path.at(-1);
      }
    });

    // 2. Collision Detection
    // Check if multiple agents are on the same cell
    const posCounts = {};
    agents.forEach(agent => {
      const pos = newPositions[agent.id];
      if (pos) {
        const key = `${pos.x},${pos.y}`;
        posCounts[key] = (posCounts[key] || 0) + 1;
        if (posCounts[key] > 1) {
          hasCollision = true;
        }
      }
    });

    // Edge Collision (Swapping)
    // Check if Agent A moved from pos1 to pos2, while Agent B moved from pos2 to pos1
    agents.forEach(a1 => {
      agents.forEach(a2 => {
        if (a1.id !== a2.id) {
          const prev1 = agentPositions[a1.id];
          const curr1 = newPositions[a1.id];
          const prev2 = agentPositions[a2.id];
          const curr2 = newPositions[a2.id];
          
          if (prev1 && curr1 && prev2 && curr2) {
            if (curr1.x === prev2.x && curr1.y === prev2.y && prev1.x === curr2.x && prev1.y === curr2.y) {
               hasCollision = true;
            }
          }
        }
      });
    });

    if (hasCollision) {
      setSimulationStatus("COLLISION / DEADLOCK DETECTED");
      setIsPlaying(false);
    } else if (isPlaying) {
      setSimulationStatus("Simulating...");
    }

    setAgentPositions(newPositions);

  }, [timeStep]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, width * cellSize, height * cellSize);
    
    // Draw Grid & Walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === 1) {
          ctx.fillStyle = "#1e293b"; // Wall (Slate 800)
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else {
          ctx.strokeStyle = "#0f172a"; // Floor border
          ctx.lineWidth = 1;
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Draw Agent Targets (Goal zones)
    agents.forEach(agent => {
       ctx.strokeStyle = agent.color;
       ctx.lineWidth = 2;
       ctx.setLineDash([4, 4]);
       ctx.strokeRect(agent.target.x * cellSize + 4, agent.target.y * cellSize + 4, cellSize - 8, cellSize - 8);
       
       // Draw letter ID in target
       ctx.fillStyle = agent.color;
       ctx.font = "12px sans-serif";
       ctx.fillText(agent.id, agent.target.x * cellSize + 10, agent.target.y * cellSize + 20);
    });
    ctx.setLineDash([]); // reset
    
    // Draw Ghost Paths
    agents.forEach(agent => {
      const path = allPaths[agent.id];
      if (path && path.length > 0) {
        ctx.beginPath();
        ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
        for(let i=1; i<path.length; i++) {
          ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
        }
        
        // Convert hex to rgba for transparency
        const hexToRgba = (hex, alpha) => {
           const r = parseInt(hex.slice(1, 3), 16);
           const g = parseInt(hex.slice(3, 5), 16);
           const b = parseInt(hex.slice(5, 7), 16);
           return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        ctx.strokeStyle = hexToRgba(agent.color, 0.2);
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    });

    // Draw Agents
    agents.forEach(agent => {
      const pos = agentPositions[agent.id] || agent.start;
      
      ctx.fillStyle = agent.color;
      ctx.beginPath();
      ctx.arc(pos.x * cellSize + cellSize/2, pos.y * cellSize + cellSize/2, cellSize/2.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(agent.id, pos.x * cellSize + 10, pos.y * cellSize + 20);
    });

  }, [grid, agents, agentPositions, allPaths]);

  const hasFailed = simulationStatus.includes("DEADLOCK");
  const hasSucceeded = simulationStatus.includes("Success");

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Network className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Agent Swarm Router</h1>
          <p className="text-muted-foreground">Cooperative Time-Space A* coordination for AGVs and drones.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
            <CardHeader className="bg-slate-900 border-b border-slate-800 pb-4">
              <CardTitle className="text-base text-slate-200 flex items-center justify-between">
                <span>Constrained Facility Layout</span>
                <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 font-mono">
                  t = {timeStep}
                </Badge>
              </CardTitle>
            </CardHeader>
            <div className="p-4 flex justify-center items-center overflow-x-auto relative min-h-[480px]">
              <canvas 
                ref={canvasRef} 
                width={width * cellSize} 
                height={height * cellSize} 
                className="bg-[#020617] rounded shadow-inner"
              />
              
              {/* Legend overlay */}
              <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-700 text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-[8px] text-white">A</div>
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">B</div>
                  <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center text-[8px] text-white">C</div>
                  <div className="w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white">D</div>
                  Autonomous Swarm Agents
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-dashed border-red-500 bg-transparent flex items-center justify-center text-[8px] text-red-500">A</div> Target Destinations
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                  <div className="w-3 h-3 bg-slate-800"></div> Impenetrable Infrastructure
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Coordination Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              
              <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="coop-mode" className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Cooperative MAPF</Label>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70">
                    If off, uses Independent Routing (guarantees deadlocks at the central cross intersection).
                  </p>
                </div>
                <Switch 
                  id="coop-mode" 
                  checked={useCooperative} 
                  onCheckedChange={(val) => {
                    setUseCooperative(val);
                    handleReset();
                  }} 
                  disabled={isPlaying}
                />
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${
            hasFailed ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10' : 
            hasSucceeded ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/10' : 
            'border-border/50'
          }`}>
            <CardHeader className={`${
              hasFailed ? 'bg-red-100/50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/30' :
              hasSucceeded ? 'bg-emerald-100/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30' :
              'bg-slate-50 dark:bg-slate-900 border-border/50'
            } pb-4 border-b`}>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className={`w-5 h-5 ${hasFailed ? 'text-red-500' : hasSucceeded ? 'text-emerald-500' : 'text-slate-500'}`} />
                Swarm Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div className={`flex items-center gap-2 p-3 rounded-md text-sm font-medium ${
                hasFailed ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                hasSucceeded ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' :
                'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
              }`}>
                {hasFailed && <TriangleAlert className="w-4 h-4" />}
                {hasSucceeded && <CheckCircle2 className="w-4 h-4" />}
                {simulationStatus}
              </div>

              {hasFailed && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  The agents computed paths without coordinating. They arrived at the central intersection simultaneously and became permanently deadlocked.
                </p>
              )}

              {hasSucceeded && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  The Cooperative MAPF algorithm successfully generated space-time reservations. Agents intentionally waited or altered their pacing to seamlessly cross paths without colliding!
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => setIsPlaying(!isPlaying)} 
                  variant={isPlaying ? "secondary" : "default"}
                  className={`flex-1 ${!isPlaying && !hasFailed && !hasSucceeded ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                  disabled={hasFailed || hasSucceeded}
                >
                  {isPlaying ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Start Swarm"}
                </Button>
                <Button onClick={handleReset} variant="outline" className="px-3">
                  Reset
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
