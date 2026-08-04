"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateRoadNetwork, calculateCloudRoute, calculateEdgeRoute, calculateDumbRoute } from "./_components/edge-algorithm";
import { Wifi, WifiOff, Map, Server, Smartphone, Route, AlertTriangle, CloudRain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function EdgeRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [connectionState, setConnectionState] = useState("cloud"); // 'cloud', 'edge', 'dumb'
  
  // Grid Configuration
  const width = 30;
  const height = 20;
  const cellSize = 20;

  const start = {x: 2, y: 2};
  const target = {x: width - 3, y: height - 3};

  // Setup Environment
  const { grid, historicalTrafficGrid, liveTrafficGrid } = useMemo(() => {
    return generateRoadNetwork(width, height);
  }, [width, height]);

  // Calculate Active Path
  const activePath = useMemo(() => {
    if (connectionState === "cloud") return calculateCloudRoute(start, target, grid, liveTrafficGrid);
    if (connectionState === "edge") return calculateEdgeRoute(start, target, grid, historicalTrafficGrid);
    return calculateDumbRoute(start, target, grid);
  }, [connectionState, grid, historicalTrafficGrid, liveTrafficGrid]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, width * cellSize, height * cellSize);
    
    // Draw Grid & Buildings
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const roadType = grid[y][x];
        
        if (roadType === 0) {
          ctx.fillStyle = "#0f172a"; // Building (Slate 900)
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (roadType === 1) {
          ctx.fillStyle = "#334155"; // Local Road (Slate 700)
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (roadType === 2) {
          ctx.fillStyle = "#475569"; // Highway (Slate 600)
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
        
        // Draw Traffic Overlay (Depends on connection state)
        if (connectionState === "cloud") {
           // Cloud sees everything
           const live = liveTrafficGrid[y][x];
           if (live > 0) {
             ctx.fillStyle = live >= 50 ? "rgba(239, 68, 68, 0.8)" : "rgba(245, 158, 11, 0.5)"; // Red (Accident), Amber (Heavy)
             ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
           }
        } else if (connectionState === "edge") {
           // Edge only sees historical
           const hist = historicalTrafficGrid[y][x];
           if (hist > 0) {
             ctx.fillStyle = "rgba(245, 158, 11, 0.5)"; // Amber (Historical bottleneck)
             ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
           }
        }
        // "Dumb" sees nothing
      }
    }
    
    // Draw Start & Target
    ctx.fillStyle = "#38bdf8"; // Start Blue
    ctx.fillRect(start.x * cellSize + 2, start.y * cellSize + 2, cellSize - 4, cellSize - 4);
    
    ctx.fillStyle = "#10b981"; // Target Green
    ctx.fillRect(target.x * cellSize + 2, target.y * cellSize + 2, cellSize - 4, cellSize - 4);

    // Draw Active Path
    if (activePath && activePath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(activePath[0].x * cellSize + cellSize/2, activePath[0].y * cellSize + cellSize/2);
      for(let i=1; i<activePath.length; i++) {
        ctx.lineTo(activePath[i].x * cellSize + cellSize/2, activePath[i].y * cellSize + cellSize/2);
      }
      
      if (connectionState === "cloud") ctx.strokeStyle = "#38bdf8"; // Blue
      else if (connectionState === "edge") ctx.strokeStyle = "#a855f7"; // Purple
      else ctx.strokeStyle = "#94a3b8"; // Slate (Dumb)
      
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

  }, [grid, historicalTrafficGrid, liveTrafficGrid, activePath, connectionState]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-3 rounded-xl transition-colors ${
          connectionState === 'cloud' ? 'bg-blue-100 dark:bg-blue-900/30' :
          connectionState === 'edge' ? 'bg-purple-100 dark:bg-purple-900/30' :
          'bg-slate-100 dark:bg-slate-900'
        }`}>
          {connectionState === 'cloud' ? <Wifi className="w-8 h-8 text-blue-600 dark:text-blue-400" /> : <WifiOff className="w-8 h-8 text-slate-500" />}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offline AI-Driven Edge Router</h1>
          <p className="text-muted-foreground">Quantized neural network fallback routing for weak connectivity zones.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
            <CardHeader className="bg-slate-900 border-b border-slate-800 pb-4">
              <CardTitle className="text-base text-slate-200 flex items-center justify-between">
                <span>City Grid Network Map</span>
                <Badge variant={connectionState === 'cloud' ? 'default' : connectionState === 'edge' ? 'secondary' : 'outline'} className="font-mono">
                  {connectionState === 'cloud' ? '📡 LTE Connected' : '📵 NO SIGNAL'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <div className="p-4 flex justify-center items-center overflow-x-auto relative min-h-[440px]">
              <canvas 
                ref={canvasRef} 
                width={width * cellSize} 
                height={height * cellSize} 
                className="bg-[#020617] rounded shadow-inner"
              />
              
              {/* Legend overlay */}
              <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-700 text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#475569]"></div> Highway (High Speed)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#334155]"></div> Local Road (Med Speed)
                </div>
                {connectionState !== "dumb" && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500/50"></div> Historical Bottleneck
                  </div>
                )}
                {connectionState === "cloud" && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500/80"></div> LIVE: Traffic Accident
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-slate-500" />
                Network Connectivity Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              
              <Button 
                onClick={() => setConnectionState("cloud")}
                variant={connectionState === "cloud" ? "default" : "outline"}
                className={`w-full justify-start ${connectionState === "cloud" ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              >
                <Server className="w-4 h-4 mr-2" />
                Online Cloud Model (Full Live Data)
              </Button>

              <Button 
                onClick={() => setConnectionState("edge")}
                variant={connectionState === "edge" ? "default" : "outline"}
                className={`w-full justify-start ${connectionState === "edge" ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Offline Quantized Edge Model
              </Button>

              <Button 
                onClick={() => setConnectionState("dumb")}
                variant={connectionState === "dumb" ? "default" : "outline"}
                className="w-full justify-start"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Offline Dumb Router (No AI Fallback)
              </Button>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${
            connectionState === 'cloud' ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/10' : 
            connectionState === 'edge' ? 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/10' : 
            'border-slate-500/50 bg-slate-50/50 dark:bg-slate-900/50'
          }`}>
            <CardHeader className={`${
              connectionState === 'cloud' ? 'bg-blue-100/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/30' :
              connectionState === 'edge' ? 'bg-purple-100/50 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-800/30' :
              'bg-slate-200/50 dark:bg-slate-800/50 border-slate-300/50 dark:border-slate-700/50'
            } pb-4 border-b`}>
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className={`w-5 h-5 ${
                  connectionState === 'cloud' ? 'text-blue-500' : 
                  connectionState === 'edge' ? 'text-purple-500' : 'text-slate-500'
                }`} />
                Routing Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {connectionState === "cloud" && (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-md text-sm font-medium">
                    Status: Optimal Route Calculated.
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    The cloud AI model successfully detected the severe live accident on the eastern local road. It optimally routed the vehicle through the city, avoiding both the historical bottleneck and the live accident.
                  </p>
                </div>
              )}

              {connectionState === "edge" && (
                <div className="space-y-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-md text-sm font-medium">
                    Status: Edge Fallback Active. Connection lost.
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    The vehicle lost internet connection. However, the quantized edge model used cached weights to avoid the historical rush-hour bottleneck in the center of town. Unfortunately, it could not foresee the live accident, so the vehicle gets temporarily delayed there.
                  </p>
                </div>
              )}

              {connectionState === "dumb" && (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-sm font-medium">
                    Status: Dumb Routing Active. Connection lost.
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Without an Edge AI fallback, the system defaults to standard pathfinding. It draws the most direct geometric path via the highway, blindly driving the user straight into the brutal historical traffic bottleneck. User experience severely downgraded.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
