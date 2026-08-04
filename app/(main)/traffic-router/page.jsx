"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateTrafficMap, calculateTrafficRoute } from "./_components/traffic-algorithm";
import { Timer, Navigation, Map as MapIcon, Car, Zap, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function TrafficRouterPage() {
  const canvasRef = useRef(null);
  
  const [speedFactor, setSpeedFactor] = useState([5]); 
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating...", totalTime: 0 });
  const [timeStep, setTimeStep] = useState(0);

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 12;

  const START = { x: 5, y: HEIGHT - 5 }; 
  const END = { x: WIDTH - 5, y: 5 }; 

  const mapData = useMemo(() => {
    return generateTrafficMap(WIDTH, HEIGHT, 1024); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculateTrafficRoute(START, END, mapData, speedFactor[0]);
    setRouteResult(result);
  }, [mapData, speedFactor]);

  // Simulation timer for traffic lights
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStep(t => t + 1);
    }, 500); // Fast forward time
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // Draw base map
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        
        // Draw roads
        if (x % 5 === 0 || y % 5 === 0) {
            ctx.fillStyle = "#334155";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }

        // Draw Intersections with animated lights
        if (node.isIntersection) {
            const currentCycleTime = (timeStep + node.offset) % node.cycleLength;
            const isGreen = currentCycleTime < (node.cycleLength / 2);
            
            ctx.fillStyle = isGreen ? "#10b981" : "#ef4444";
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = "#3b82f6"; 
    ctx.beginPath();
    ctx.arc(START.x * CELL_SIZE + CELL_SIZE/2, START.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#f59e0b"; 
    ctx.beginPath();
    ctx.arc(END.x * CELL_SIZE + CELL_SIZE/2, END.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const path = routeResult.path;
    if (path && path.length > 0) {
      ctx.strokeStyle = "#0ea5e9"; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      ctx.stroke();
    }

  }, [mapData, speedFactor, routeResult, timeStep]);

  const isSafe = routeResult.path && routeResult.path.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
          <Car className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adaptive Traffic Light Synchronization Pathing</h1>
          <p className="text-muted-foreground">Optimal driving speeds to hit "green waves" using Smart City V2I data.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-4 flex justify-center items-center overflow-x-auto relative">
              <canvas 
                ref={canvasRef} 
                width={WIDTH * CELL_SIZE} 
                height={HEIGHT * CELL_SIZE} 
                className="bg-slate-950 rounded-md shadow-inner"
                style={{ width: WIDTH * CELL_SIZE, height: HEIGHT * CELL_SIZE }}
                aria-label="Interactive map showing traffic-aware routes, synchronized lights, and intersections"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Green Light Phase</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Red Light Phase</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-cyan-500"></div> Synchronized Trajectory</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-cyan-500/20 shadow-sm">
            <CardHeader className="bg-cyan-50 dark:bg-cyan-950/20 pb-4 border-b border-cyan-100 dark:border-cyan-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-500" />
                    V2I Telemetry
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    Cruising Speed (Grid Delay)
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{speedFactor[0]}s per block</span>
                </div>
                <Slider 
                  value={speedFactor} 
                  onValueChange={setSpeedFactor} 
                  min={1} max={10} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Adjust the vehicle's cruising speed. The AI will reroute to intersections where lights will turn green right as the vehicle arrives.</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-cyan-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-cyan-500' : 'text-red-500'}`} />
                  Flow Assessment
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-cyan-600 border-cyan-200" : ""}>
                  {isSafe ? "Green Wave Locked" : "CONGESTED"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> Total Est. Time</span>
                    <span className="font-mono font-medium text-amber-600">{routeResult.totalTime}s</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><MapIcon className="w-3 h-3"/> Grid Distance</span>
                    <span className="font-mono font-medium text-emerald-600">{routeResult.path.length} blocks</span>
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
