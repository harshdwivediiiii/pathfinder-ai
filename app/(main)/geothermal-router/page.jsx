"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateGeology, calculateDrillPath } from "./_components/drill-algorithm";
import { Flame, Mountain, Activity, Map, Route, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GeothermalRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [seed, setSeed] = useState(0); // Trigger new geology generation
  const [drillPath, setDrillPath] = useState([]);
  
  // Grid Configuration (Cross-section size)
  const width = 100;
  const depth = 80;
  const cellSize = 8; // Pixels per grid cell

  // Physics & Geology Generation
  const { grid, target } = useMemo(() => {
    return generateGeology(width, depth);
  }, [seed]);

  const startRig = useMemo(() => {
    return { x: Math.floor(width / 2), y: 0 };
  }, [width]);

  // Recalculate Drill Path
  useEffect(() => {
    const path = calculateDrillPath(startRig, target, grid);
    setDrillPath(path);
  }, [grid, startRig, target]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const canvasW = width * cellSize;
    const canvasH = depth * cellSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasW, canvasH);
    
    // Draw Geological Grid
    for (let y = 0; y < depth; y++) {
      for (let x = 0; x < width; x++) {
        const type = grid[y][x];
        
        const px = x * cellSize;
        const py = y * cellSize;
        
        switch(type) {
          case 0: 
            // Sedimentary Rock (Background gradient based on depth)
            const darkness = Math.floor((y / depth) * 50);
            ctx.fillStyle = `rgb(${180 - darkness}, ${150 - darkness}, ${120 - darkness})`;
            ctx.fillRect(px, py, cellSize, cellSize);
            break;
          case 1:
            // Impenetrable Granite
            ctx.fillStyle = "#334155"; // Slate 700
            ctx.fillRect(px, py, cellSize, cellSize);
            break;
          case 2:
            // Tectonic Fracture
            ctx.fillStyle = "#38bdf8"; // Sky Blue (Water/Steam flow)
            ctx.fillRect(px, py, cellSize, cellSize);
            break;
          case 3:
            // Thermal Reservoir
            ctx.fillStyle = "#ef4444"; // Red 500
            ctx.fillRect(px, py, cellSize, cellSize);
            break;
        }
      }
    }
    
    // Draw Surface layer
    ctx.fillStyle = "#22c55e"; // Green surface
    ctx.fillRect(0, 0, canvasW, cellSize);

    // Draw Drill Rig (Start)
    ctx.fillStyle = "#f59e0b"; // Amber
    ctx.beginPath();
    ctx.moveTo(startRig.x * cellSize - 10, startRig.y * cellSize);
    ctx.lineTo(startRig.x * cellSize + 10, startRig.y * cellSize);
    ctx.lineTo(startRig.x * cellSize, startRig.y * cellSize + 20);
    ctx.fill();

    // Draw Drill Path
    if (drillPath && drillPath.length > 0) {
      ctx.strokeStyle = "#fbbf24"; // Amber 400
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.beginPath();
      // Start slightly below rig
      ctx.moveTo(drillPath[0].x * cellSize + (cellSize/2), drillPath[0].y * cellSize + (cellSize/2));
      
      for (let i = 1; i < drillPath.length; i++) {
        ctx.lineTo(drillPath[i].x * cellSize + (cellSize/2), drillPath[i].y * cellSize + (cellSize/2));
      }
      ctx.stroke();
      
      // Draw Drill Bit at the end
      const endPoint = drillPath[drillPath.length - 1];
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(endPoint.x * cellSize + (cellSize/2), endPoint.y * cellSize + (cellSize/2), 4, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [grid, drillPath, startRig]);

  const isSuccess = drillPath.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <Flame className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geothermal Drill Router</h1>
          <p className="text-muted-foreground">Geological directional-drilling pathfinder for subterranean energy extraction.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="p-4 flex justify-center items-center overflow-x-auto relative bg-slate-900 border-b border-border">
              <canvas 
                ref={canvasRef} 
                width={width * cellSize} 
                height={depth * cellSize} 
                className="bg-transparent rounded-md border border-slate-700 shadow-xl"
              />
              
              {/* Legend overlay */}
              <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-700 text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#8c7864] rounded border border-slate-600"></div> Sedimentary (Drillable)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-700 rounded border border-slate-600"></div> Granite (Impenetrable)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-sky-500 rounded border border-sky-400"></div> Tectonic Fracture (Optimal)</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded border border-red-400"></div> Thermal Reservoir (Target)</div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                  <div className="w-4 h-1 bg-amber-400 rounded"></div> Directional Drill Path
                </div>
              </div>
            </div>
            
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-red-500/20 shadow-sm">
            <CardHeader className="bg-red-50 dark:bg-red-950/20 pb-4 border-b border-red-100 dark:border-red-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Map className="w-5 h-5 text-red-500" />
                Seismic Reflection Data
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="text-sm text-muted-foreground leading-relaxed">
                The map displays procedural subterranean geological data. The algorithm must calculate a <strong>smooth, parabolic drill path</strong> from the surface rig down to the red thermal reservoir.
              </div>

              <Button 
                onClick={() => setSeed(s => s + 1)} 
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Scan New Geology Sector
              </Button>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSuccess ? 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10' : 'border-slate-800 bg-slate-900'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${isSuccess ? 'text-amber-500' : 'text-slate-500'}`} />
                  Drill Telemetry
                </div>
                {isSuccess ? (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-white dark:bg-black">
                    RESERVOIR TAPPED
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    NO ROUTE
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p className={`${isSuccess ? 'text-amber-800 dark:text-amber-400' : 'text-slate-400'} leading-relaxed`}>
                  {isSuccess 
                    ? "The pathfinder successfully plotted a directional route, avoiding dense granite and actively seeking out high-flow tectonic fractures to reach the reservoir."
                    : "The drill bit is blocked. Solid granite formations prevent a safe parabolic routing to the thermal target."}
                </p>
                
                {isSuccess && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                     <div className="bg-white dark:bg-black p-2 rounded border border-amber-100 flex flex-col items-center">
                       <span className="text-xs text-muted-foreground uppercase">Well Depth</span>
                       <span className="font-mono text-lg font-bold">{drillPath.length * 10}m</span>
                     </div>
                     <div className="bg-white dark:bg-black p-2 rounded border border-amber-100 flex flex-col items-center">
                       <span className="text-xs text-muted-foreground uppercase">Path Segments</span>
                       <span className="font-mono text-lg font-bold">{drillPath.length}</span>
                     </div>
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
