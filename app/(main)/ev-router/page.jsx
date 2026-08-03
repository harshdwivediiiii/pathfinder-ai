"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateEVMap, calculateEVRoute } from "./_components/ev-algorithm";
import { Battery, Navigation, Map as MapIcon, Zap, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function EVRouterPage() {
  const canvasRef = useRef(null);
  
  const [startBattery, setStartBattery] = useState([50]); 
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const width = 60;
  const height = 40;
  const cellSize = 12;

  const start = { x: 5, y: height - 10 }; 
  const end = { x: width - 5, y: 5 }; 
  const maxBattery = 100;

  const { elevationMap, stations } = useMemo(() => {
    return generateEVMap(width, height, 999); 
  }, [width, height]);

  useEffect(() => {
    const result = calculateEVRoute(start, end, elevationMap, stations, startBattery[0], maxBattery);
    setRouteResult(result);
  }, [elevationMap, stations, startBattery, start, end]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, width * cellSize, height * cellSize);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const elevation = elevationMap[y][x];
        const normalizedElev = elevation / 1000;
        
        let r = 30 + normalizedElev * 100;
        let g = 40 + normalizedElev * 150;
        let b = 30 + normalizedElev * 100;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = "rgba(0,0,0,0.1)";
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

    stations.forEach(station => {
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(station.x * cellSize + cellSize/2, station.y * cellSize + cellSize/2, cellSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#ef4444"; 
    ctx.beginPath();
    ctx.arc(start.x * cellSize + cellSize/2, start.y * cellSize + cellSize/2, cellSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#10b981"; 
    ctx.beginPath();
    ctx.arc(end.x * cellSize + cellSize/2, end.y * cellSize + cellSize/2, cellSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const path = routeResult.path;
    if (path && path.length > 0) {
      ctx.strokeStyle = "#10b981"; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
      }
      ctx.stroke();

      path.forEach(p => {
        if (p.charge) {
          ctx.fillStyle = "#eab308";
          ctx.beginPath();
          ctx.arc(p.x * cellSize + cellSize/2, p.y * cellSize + cellSize/2, cellSize * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "black";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }

  }, [elevationMap, stations, routeResult, start, end]);

  const isSafe = routeResult.path && routeResult.path.length > 0;
  const chargeStops = routeResult.path?.filter(p => p.charge)?.length || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Energy-Optimized EV Router</h1>
          <p className="text-muted-foreground">Eco-Path mode factoring in elevation changes, regenerative braking, and charging networks.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-4 flex justify-center items-center overflow-x-auto relative">
              <canvas 
                ref={canvasRef} 
                width={width * cellSize} 
                height={height * cellSize} 
                className="bg-slate-800 rounded-md shadow-inner"
                style={{ width: width * cellSize, height: height * cellSize }}
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div> Origin</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></div> Destination</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Charging Station</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 border border-black"></div> Charge Stop Taken</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-emerald-500"></div> Eco Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-green-500/20 shadow-sm">
            <CardHeader className="bg-green-50 dark:bg-green-950/20 pb-4 border-b border-green-100 dark:border-green-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Battery className="w-5 h-5 text-green-500" />
                Fleet Battery State
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    Initial Charge
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{startBattery[0]}%</span>
                </div>
                <Slider 
                  value={startBattery} 
                  onValueChange={setStartBattery} 
                  min={10} max={100} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Set the starting battery capacity. The pathfinder will automatically route through charging stations if the range is insufficient.</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-emerald-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-emerald-500' : 'text-red-500'}`} />
                  Route Status
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-emerald-600 border-emerald-200" : ""}>
                  {isSafe ? "Route Active" : "STRANDED"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><MapIcon className="w-3 h-3"/> Distance</span>
                    <span className="font-mono font-medium">{routeResult.path.length * 5} km</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Battery className="w-3 h-3"/> Charging Stops</span>
                    <span className="font-mono font-medium text-blue-600">{chargeStops}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    The pathfinder is optimizing for elevation changes, utilizing regenerative braking on downhills to maximize range.
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
