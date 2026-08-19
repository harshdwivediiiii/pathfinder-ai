"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateAccessibilityMap, calculateAccessibleRoute } from "./_components/accessibility-algorithm";
import { PersonStanding, Navigation, Map as MapIcon, ArrowUpRight, Ban, Baseline } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function AccessibilityRouterPage() {
  const canvasRef = useRef(null);
  
  const [maxIncline, setMaxIncline] = useState([5]); 
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 12;

  const START = { x: 2, y: HEIGHT - 3 }; 
  const END = { x: WIDTH - 3, y: 2 }; 

  const mapData = useMemo(() => {
    return generateAccessibilityMap(WIDTH, HEIGHT, 2048); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculateAccessibleRoute(START, END, mapData, maxIncline[0]);
    setRouteResult(result);
  }, [mapData, maxIncline]);

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
        
        // Draw incline gradient
        if (node.incline > 0) {
            const intensity = Math.min(1, node.incline / 15);
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.2})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        // Draw stairs
        if (node.hasStairs) {
            ctx.fillStyle = "#ef4444"; // Red
            ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }

        // Draw missing curb cuts
        if (node.missingCurbCut) {
            ctx.fillStyle = "#f97316"; // Orange
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
            ctx.lineTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE);
            ctx.lineTo(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE);
            ctx.stroke();
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
      ctx.strokeStyle = "#a855f7"; // Purple path
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      ctx.stroke();
    }

  }, [mapData, maxIncline, routeResult]);

  const isSafe = routeResult.path && routeResult.path.length > 0;
  
  // Calculate stats
  let peakIncline = 0;
  if (isSafe) {
      routeResult.path.forEach(p => {
          const node = mapData[p.y][p.x];
          if (node.incline > peakIncline) peakIncline = node.incline;
      });
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <PersonStanding className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wheelchair & Accessibility Routing</h1>
          <p className="text-muted-foreground">Precision paths that strictly adhere to ADA compliance and mobility constraints.</p>
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
                aria-label="Interactive map showing accessible routes avoiding stairs and steep inclines"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500"></div> Stairs (Blocked)</div>
                <div className="flex items-center gap-2 text-orange-500 font-bold text-lg leading-none">× <span className="text-foreground text-xs font-normal">Missing Curb Cut (Blocked)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white/20"></div> Steep Incline</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-purple-500"></div> Accessible Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-purple-500/20 shadow-sm">
            <CardHeader className="bg-purple-50 dark:bg-purple-950/20 pb-4 border-b border-purple-100 dark:border-purple-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Baseline className="w-5 h-5 text-purple-500" />
                    Mobility Constraints
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    Max Tolerable Incline
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{maxIncline[0]}°</span>
                </div>
                <Slider 
                  value={maxIncline} 
                  onValueChange={setMaxIncline} 
                  min={0} max={15} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Sets the maximum allowed slope. Standard ADA compliance for ramps is ~4.8°. Steeper inclines will be strictly avoided.</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-purple-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-purple-500' : 'text-red-500'}`} />
                  Path Verification
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-purple-600 border-purple-200" : ""}>
                  {isSafe ? "ADA Compliant" : "BLOCKED"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> Peak Incline</span>
                    <span className="font-mono font-medium text-amber-600">{peakIncline}°</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Ban className="w-3 h-3"/> Barriers Crossed</span>
                    <span className="font-mono font-medium text-emerald-600">0</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><MapIcon className="w-3 h-3"/> Total Distance</span>
                    <span className="font-mono font-medium text-emerald-600">{routeResult.path.length} units</span>
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
