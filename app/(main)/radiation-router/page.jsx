"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { generateDosimeterMap, calculateRadiationPath } from "./_components/dosimeter-algorithm";
import { Activity, ShieldAlert, Zap, Timer, Route } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export default function RadiationRouterPage() {
  const canvasRef = useRef(null);
  
  // Simulation State
  const [robotSpeed, setRobotSpeed] = useState([10]); // cells per hour
  const [maxSieverts, setMaxSieverts] = useState([50]); // Max Sv budget
  
  // Results State
  const [routeResult, setRouteResult] = useState({ path: [], totalDose: 0, status: "Calculating..." });

  // Grid Configuration
  const width = 60;
  const height = 40;
  const cellSize = 15; // pixels for rendering

  // Hardcoded scenario: Start at top-left, End at bottom-right
  const start = { x: 2, y: 2 };
  const end = { x: width - 3, y: height - 3 };
  
  // Generate the map once (or when hotspots change)
  const dosimeterMap = useMemo(() => {
    // Hotspots represent damaged reactor cores or spilled material
    const hotspots = [
      { x: 30, y: 20, intensity: 1500 }, // Central massive leak
      { x: 15, y: 30, intensity: 800 },  // Secondary leak
      { x: 45, y: 10, intensity: 1000 }, // Broken pipe
    ];
    return generateDosimeterMap(width, height, hotspots);
  }, [width, height]);

  // Recalculate route when parameters change
  useEffect(() => {
    const result = calculateRadiationPath(start, end, dosimeterMap, robotSpeed[0], maxSieverts[0]);
    setRouteResult(result);
  }, [dosimeterMap, robotSpeed, maxSieverts]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Heatmap Grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const intensity = dosimeterMap[y][x];
        
        // Heatmap color calculation
        // Low: Blue, Medium: Yellow, High: Red/White
        let r, g, b;
        if (intensity < 1) { // Background
          r = 15; g = 23; b = 42; // Slate 900
        } else if (intensity < 10) {
          r = 30; g = 58; b = 138; // Blue 900
        } else if (intensity < 50) {
          r = 234; g = 179; b = 8; // Yellow 500
        } else if (intensity < 200) {
          r = 239; g = 68; b = 68; // Red 500
        } else {
          r = 255; g = 255; b = 255; // White hot
        }
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    
    // Draw Start and End Points
    ctx.fillStyle = "#22c55e"; // Green start
    ctx.beginPath();
    ctx.arc(start.x * cellSize + cellSize/2, start.y * cellSize + cellSize/2, cellSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#ef4444"; // Red end
    ctx.beginPath();
    ctx.arc(end.x * cellSize + cellSize/2, end.y * cellSize + cellSize/2, cellSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw Computed Path
    if (routeResult.path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(start.x * cellSize + cellSize/2, start.y * cellSize + cellSize/2);
      
      for (const p of routeResult.path) {
        ctx.lineTo(p.x * cellSize + cellSize/2, p.y * cellSize + cellSize/2);
      }
      
      // If the path failed, draw it in dashed red to show where it gave up or died.
      // If successful, draw it in bright cyan.
      if (routeResult.status === "Success") {
        ctx.strokeStyle = "#06b6d4"; // Cyan 500
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = "#f43f5e"; // Rose 500
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
      }
      
      ctx.stroke();
    }
    
  }, [dosimeterMap, routeResult, width, height, cellSize]);

  // Compute stats
  const estimatedTime = (routeResult.path.length / robotSpeed[0]).toFixed(2);

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Disaster Recovery Robotics</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Radiation-Aware <span className="text-yellow-500">Pathfinder.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ingests 3D dosimeter maps to route decommissioning robots. Calculates cumulative ionizing radiation exposure to prevent catastrophic electronic failure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls Panel */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-yellow-500" />
              Hardware Constraints
            </CardTitle>
            <CardDescription>Adjust robot parameters to see routing adaptations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-400" /> Robot Speed
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{robotSpeed[0]} c/hr</span>
              </div>
              <Slider 
                value={robotSpeed} 
                onValueChange={setRobotSpeed} 
                max={50} 
                min={2} 
                step={2}
                className="py-4"
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                Lower speed means the robot spends more time in each cell, absorbing a higher cumulative dose.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-500" /> Max Dose Budget
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{maxSieverts[0]} Sv</span>
              </div>
              <Slider 
                value={maxSieverts} 
                onValueChange={setMaxSieverts} 
                max={200} 
                min={10} 
                step={5}
                className="py-4"
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                The total Sieverts the robot's electronics can withstand before failure.
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border">
              <strong>Algorithm:</strong> Edge Cost = (Intensity * Time Spent). The A* variant seeks to minimize the total sum of absorbed radiation, not physical distance.
            </div>

          </CardContent>
        </Card>

        {/* Dosimeter Map & Telemetry */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          
          {/* Telemetry Dashboard */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="glass border-border rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${routeResult.status === 'Success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                  <Route className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Mission Status</p>
                  <p className={`text-lg font-bold ${routeResult.status === 'Success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {routeResult.status}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass border-border rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-500">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Cumulative Dose</p>
                  <p className="text-lg font-bold text-foreground">
                    {routeResult.totalDose.toFixed(1)} Sv
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                  <Timer className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Est. Time</p>
                  <p className="text-lg font-bold text-foreground">
                    {estimatedTime} hrs
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas Map */}
          <Card className="glass border-border rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className="bg-background/30 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    Facility Dosimeter Map
                  </CardTitle>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700"></div> Low</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-900 border border-blue-700"></div></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-white border border-slate-300"></div> Lethal</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 flex justify-center items-center bg-[#000000]">
               <canvas 
                  ref={canvasRef} 
                  width={width * cellSize} 
                  height={height * cellSize}
                  className="rounded-xl border border-slate-800 shadow-2xl"
               />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
