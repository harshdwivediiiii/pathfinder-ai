"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateMineNetwork, simulateAirflow, calculateSafeVentilationRoute } from "./_components/mine-algorithm";
import { Wind, Skull, Navigation, Fan, Power, ShieldAlert, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function MineRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [fan1Active, setFan1Active] = useState(true);
  const [fan2Active, setFan2Active] = useState(true);
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  // Grid Configuration
  const width = 60;
  const height = 40;
  const cellSize = 12; // pixels for rendering

  // Generate Mine Network once
  const mineNetwork = useMemo(() => {
    return generateMineNetwork(width, height);
  }, [width, height]);

  // Scenario setup
  const miners = { x: width - 5, y: height - 10 };
  const surfaceExit = { x: Math.floor(width / 2), y: 0 };
  
  // Leaks
  const gasLeaks = useMemo(() => [
    { x: Math.floor(width / 2), y: 15, intensity: 5.0 }, // Leak in main shaft
    { x: 10, y: height - 15, intensity: 3.0 } // Secondary leak
  ], [width, height]);

  // Fans
  const fans = [
    { id: 1, x: Math.floor(width / 2) + 1, y: 15, power: 12, active: fan1Active },
    { id: 2, x: 20, y: height - 10, power: 8, active: fan2Active }
  ];

  // Simulate Gas Diffusion based on fan state
  const gasMap = useMemo(() => {
    return simulateAirflow(mineNetwork, gasLeaks, fans);
  }, [mineNetwork, gasLeaks, fan1Active, fan2Active]); // Dependencies specifically mapped to active states

  // Recalculate route
  useEffect(() => {
    const result = calculateSafeVentilationRoute(miners, surfaceExit, mineNetwork, gasMap);
    setRouteResult(result);
  }, [mineNetwork, gasMap, miners, surfaceExit]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, width * cellSize, height * cellSize);

    // Draw Mine Environment
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mineNetwork[y][x] === 0) {
          // Solid rock
          ctx.fillStyle = "#1e293b"; // Slate 800
        } else {
          // Open Tunnel
          const gasLevel = gasMap[y][x];
          if (gasLevel > 0) {
            // Tint tunnel with toxic gas (green/yellow)
            const alpha = Math.min(1.0, gasLevel * 1.5);
            ctx.fillStyle = `rgba(163, 230, 53, ${alpha})`; // Lime-400 tint
          } else {
            ctx.fillStyle = "#334155"; // Slate 700 (dark tunnel)
          }
        }
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // Draw Fans
    fans.forEach(fan => {
      ctx.beginPath();
      ctx.arc(fan.x * cellSize + cellSize/2, fan.y * cellSize + cellSize/2, cellSize, 0, Math.PI * 2);
      ctx.fillStyle = fan.active ? "#3b82f6" : "#64748b"; // Blue if active, grey if off
      ctx.fill();
      
      if (fan.active) {
        // Draw airflow radius visualization
        ctx.beginPath();
        ctx.arc(fan.x * cellSize + cellSize/2, fan.y * cellSize + cellSize/2, fan.power * cellSize, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
        ctx.fill();
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw Gas Leaks
    gasLeaks.forEach(leak => {
      ctx.beginPath();
      ctx.arc(leak.x * cellSize + cellSize/2, leak.y * cellSize + cellSize/2, cellSize * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444"; // Red origin
      ctx.fill();
    });

    // Draw Surface Exit
    ctx.fillStyle = "#10b981"; // Emerald
    ctx.fillRect(surfaceExit.x * cellSize - cellSize, 0, cellSize * 3, cellSize * 2);

    // Draw Miners
    ctx.fillStyle = "#f59e0b"; // Amber (hardhat color)
    ctx.beginPath();
    ctx.arc(miners.x * cellSize + cellSize/2, miners.y * cellSize + cellSize/2, cellSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Route Path
    const path = routeResult.path;
    if (path && path.length > 0) {
      ctx.strokeStyle = "#38bdf8"; // Sky blue safe path
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
      }
      ctx.stroke();
    }

  }, [mineNetwork, gasMap, routeResult, fan1Active, fan2Active]);

  const isSafe = routeResult.path.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-lime-100 dark:bg-lime-900/30 rounded-xl">
          <Wind className="w-8 h-8 text-lime-600 dark:text-lime-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mine Ventilation Rescue Router</h1>
          <p className="text-muted-foreground">Dynamic subterranean routing through clean oxygen corridors.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
            <div className="p-4 flex justify-center items-center overflow-x-auto relative">
              <canvas 
                ref={canvasRef} 
                width={width * cellSize} 
                height={height * cellSize} 
                className="bg-black rounded-md shadow-inner"
                style={{ width: width * cellSize, height: height * cellSize }}
              />
              
              {/* Legend overlay */}
              <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-700 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 border border-white"></div> Trapped Miners</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Surface Exit</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Toxic Gas Leak</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Active Fan</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-sky-400"></div> Oxygen Rescue Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-lime-500/20 shadow-sm">
            <CardHeader className="bg-lime-50 dark:bg-lime-950/20 pb-4 border-b border-lime-100 dark:border-lime-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Fan className="w-5 h-5 text-lime-500" />
                Ventilation System Control
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Main Shaft Fan</span>
                  <span className="text-xs text-muted-foreground">Clears gas near exit.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${fan1Active ? 'text-blue-500' : 'text-slate-400'}`} />
                  <Switch checked={fan1Active} onCheckedChange={setFan1Active} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Deep Level Blower</span>
                  <span className="text-xs text-muted-foreground">Pushes air through lower tunnels.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${fan2Active ? 'text-blue-500' : 'text-slate-400'}`} />
                  <Switch checked={fan2Active} onCheckedChange={setFan2Active} />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Toggle fans to simulate mechanical failures. The pathfinder will dynamically recalculate the route to avoid deadly gas accumulation.
              </p>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-sky-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${isSafe ? 'text-sky-500' : 'text-red-500'}`} />
                  Telemetry
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-sky-600 border-sky-200" : ""}>
                  {isSafe ? "CLEAN ROUTE" : "TRAPPED"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-sm mb-4 font-medium ${!isSafe ? 'text-red-600 dark:text-red-400' : ''}`}>
                {routeResult.status}
              </p>
              
              {isSafe && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Navigation className="w-3 h-3"/> Route Distance</span>
                    <span className="font-mono font-medium">{routeResult.path.length * 5}m</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Skull className="w-3 h-3"/> Toxic Gas Avoided</span>
                    <span className="font-mono font-medium text-emerald-600">Verified</span>
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
