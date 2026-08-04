"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateHeatMap, calculateSafeRoute } from "./_components/heatmap-algorithm";
import { ShieldAlert, Navigation, Map as MapIcon, Car, AlertOctagon, HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function HeatmapRouterPage() {
  const canvasRef = useRef(null);
  
  const [riskAversion, setRiskAversion] = useState([15]); 
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 12;

  const START = { x: 2, y: 2 }; 
  const END = { x: WIDTH - 3, y: HEIGHT - 3 }; 

  const mapData = useMemo(() => {
    return generateHeatMap(WIDTH, HEIGHT, 2048); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculateSafeRoute(START, END, mapData, riskAversion[0]);
    setRouteResult(result);
  }, [mapData, riskAversion]);

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
        
        // Draw accident heatmap
        if (node.heat > 0.1) {
            // Gradient from yellow to red based on heat
            const r = Math.floor(255);
            const g = Math.floor(255 * (1 - node.heat));
            const b = 0;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${node.heat * 0.8})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
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

    ctx.fillStyle = "#10b981"; 
    ctx.beginPath();
    ctx.arc(END.x * CELL_SIZE + CELL_SIZE/2, END.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const path = routeResult.path;
    if (path && path.length > 0) {
      ctx.strokeStyle = "#8b5cf6"; // Violet path
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      ctx.stroke();
    }

  }, [mapData, riskAversion, routeResult]);

  const isSafe = routeResult.path && routeResult.path.length > 0;
  
  // Calculate stats
  let totalRiskExposure = 0;
  let maxRiskEncountered = 0;
  if (isSafe) {
      routeResult.path.forEach(p => {
          const heat = mapData[p.y][p.x].heat;
          totalRiskExposure += heat;
          if (heat > maxRiskEncountered) maxRiskEncountered = heat;
      });
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
          <AlertOctagon className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historical Accident Heatmap Routing</h1>
          <p className="text-muted-foreground">Integrating actuarial risk models to navigate away from high-collision intersections.</p>
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
                aria-label="Interactive map showing routes avoiding accident clusters"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-600/80"></div> High Collision Density</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-orange-400/60"></div> Moderate Risk</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-slate-800"></div> Safe Zone</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-violet-500"></div> Chosen Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-rose-500/20 shadow-sm">
            <CardHeader className="bg-rose-50 dark:bg-rose-950/20 pb-4 border-b border-rose-100 dark:border-rose-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    Risk Mitigation
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-muted-foreground" />
                    Risk Aversion Factor
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{riskAversion[0]}x Penalty</span>
                </div>
                <Slider 
                  value={riskAversion} 
                  onValueChange={setRiskAversion} 
                  min={0} max={30} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Adjust how strongly the router avoids historical crash sites vs taking the shortest path.</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-violet-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-violet-500' : 'text-red-500'}`} />
                  Actuarial Assessment
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-violet-600 border-violet-200" : ""}>
                  {isSafe ? "Route Validated" : "UNSAFE"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> Cumulative Risk</span>
                    <span className="font-mono font-medium text-amber-600">{totalRiskExposure.toFixed(2)} units</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Peak Danger Zone</span>
                    <span className="font-mono font-medium text-rose-600">{(maxRiskEncountered * 100).toFixed(0)}% severity</span>
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
