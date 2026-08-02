"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateElevationMap, calculateSafeRoute } from "./_components/flood-algorithm";
import { Droplets, Navigation, Map as MapIcon, ShieldAlert, Waves, Home, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function FloodRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [waterLevel, setWaterLevel] = useState([20]); // meters
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  // Grid Configuration
  const width = 60;
  const height = 40;
  const cellSize = 12; // pixels for rendering

  // Hardcoded Scenario: Evacuate from coastal/lowland house to high-ground shelter
  const start = { x: 5, y: height - 10 }; // House
  const end = { x: width - 5, y: 5 }; // Shelter

  // Generate topographical map once
  const elevationMap = useMemo(() => {
    return generateElevationMap(width, height, 12345); // Fixed seed for reproducible terrain
  }, [width, height]);

  // Recalculate route when water level changes
  useEffect(() => {
    const result = calculateSafeRoute(start, end, elevationMap, waterLevel[0]);
    setRouteResult(result);
  }, [elevationMap, waterLevel, start, end]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, width * cellSize, height * cellSize);

    // Draw Topography and Flood Water
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const elevation = elevationMap[y][x];
        
        if (elevation <= waterLevel[0]) {
          // Flooded - Draw water (varying depth)
          const depth = waterLevel[0] - elevation;
          const alpha = Math.min(1.0, 0.5 + (depth / 20));
          ctx.fillStyle = `rgba(14, 165, 233, ${alpha})`; // Sky blue
        } else {
          // Dry Land - Draw topography
          // Map elevation to a topological color (greens to browns to whites for very high)
          const normalizedElev = elevation / 100;
          let r, g, b;
          if (normalizedElev < 0.3) {
            // Lowlands: Greenish
            r = 132 + (normalizedElev * 100); g = 204; b = 22 - (normalizedElev * 50);
          } else if (normalizedElev < 0.7) {
            // Hills: Brownish
            r = 217; g = 119 + ((normalizedElev - 0.3) * 100); b = 6;
          } else {
            // Peaks: Grey/White
            const val = 150 + ((normalizedElev - 0.7) * 300);
            r = val; g = val; b = val;
          }
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        }
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // Draw Grid subtle lines
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

    // Draw Start (House)
    ctx.fillStyle = "#ef4444"; // Red
    ctx.beginPath();
    ctx.arc(start.x * cellSize + cellSize/2, start.y * cellSize + cellSize/2, cellSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw End (Shelter)
    ctx.fillStyle = "#10b981"; // Emerald
    ctx.beginPath();
    ctx.arc(end.x * cellSize + cellSize/2, end.y * cellSize + cellSize/2, cellSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw Path
    const path = routeResult.path;
    if (path && path.length > 0) {
      ctx.strokeStyle = "#f59e0b"; // Amber warning path
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
      }
      ctx.stroke();
    }

  }, [elevationMap, waterLevel, routeResult, start, end]);

  const isSafe = routeResult.path.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
          <Waves className="w-8 h-8 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urban Flood Evacuation Router</h1>
          <p className="text-muted-foreground">Dynamic hydrological pathfinding to route traffic exclusively via high ground.</p>
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
              
              {/* Legend overlay */}
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div> Evacuation Origin</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></div> Safe Shelter</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-amber-500"></div> Evacuation Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-sky-500/20 shadow-sm">
            <CardHeader className="bg-sky-50 dark:bg-sky-950/20 pb-4 border-b border-sky-100 dark:border-sky-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="w-5 h-5 text-sky-500" />
                Hydrological Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Waves className="w-4 h-4 text-muted-foreground" />
                    Flood Water Level
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{waterLevel[0]} meters</span>
                </div>
                <Slider 
                  value={waterLevel} 
                  onValueChange={setWaterLevel} 
                  min={0} max={60} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Simulate rising flash flood waters. Low-lying streets will be dynamically invalidated.</p>
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
                  {isSafe ? "Route Active" : "ISOLATED"}
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
                    <span className="font-mono font-medium">{routeResult.path.length * 10}m</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Hazards Avoided</span>
                    <span className="font-mono font-medium text-emerald-600">Yes</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    The pathfinder is actively avoiding streets within 5 meters of the flood line to ensure a safe buffer.
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
