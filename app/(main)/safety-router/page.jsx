"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateSafetyMap, calculateSafetyRoute } from "./_components/safety-algorithm";
import { ShieldCheck, Navigation, Map as MapIcon, Moon, AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function SafetyRouterPage() {
  const canvasRef = useRef(null);
  
  const [safetyWeight, setSafetyWeight] = useState([5]); 
  const [isNightTime, setIsNightTime] = useState(true);
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const WIDTH = 50;
  const HEIGHT = 40;
  const CELL_SIZE = 12;

  const START = { x: 5, y: HEIGHT - 10 }; 
  const END = { x: WIDTH - 5, y: 5 }; 

  const mapData = useMemo(() => {
    return generateSafetyMap(WIDTH, HEIGHT, 1024); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculateSafetyRoute(START, END, mapData, safetyWeight[0], isNightTime);
    setRouteResult(result);
  }, [mapData, safetyWeight, isNightTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        
        // Base color
        if (isNightTime) {
            ctx.fillStyle = node.isLit ? "#1e293b" : "#0f172a"; // Darker if unlit
        } else {
            ctx.fillStyle = "#f8fafc";
        }
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Incident density indicator
        if (node.incidentDensity === 'high') {
            ctx.fillStyle = isNightTime ? "rgba(220, 38, 38, 0.4)" : "rgba(220, 38, 38, 0.2)";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (node.incidentDensity === 'medium') {
            ctx.fillStyle = isNightTime ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.15)";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        // Lighting indicator
        if (isNightTime && node.isLit) {
            ctx.fillStyle = "rgba(253, 224, 71, 0.15)";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    ctx.strokeStyle = isNightTime ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
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
      ctx.strokeStyle = "#8b5cf6"; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      ctx.stroke();
    }

  }, [mapData, safetyWeight, isNightTime, routeResult]);

  const isSafe = routeResult.path && routeResult.path.length > 0;
  
  // Calculate risk metrics
  let unlitCount = 0;
  let highRiskCount = 0;
  if (isSafe) {
      routeResult.path.forEach(p => {
          const node = mapData[p.y][p.x];
          if (!node.isLit) unlitCount++;
          if (node.incidentDensity === 'high') highRiskCount++;
      });
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedestrian Safety-First Routing</h1>
          <p className="text-muted-foreground">Prioritizing well-lit and populated corridors to enhance personal security.</p>
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
                className={`${isNightTime ? 'bg-slate-950' : 'bg-slate-100'} rounded-md shadow-inner transition-colors duration-500`}
                style={{ width: WIDTH * CELL_SIZE, height: HEIGHT * CELL_SIZE }}
                aria-label="Interactive map showing safety-aware routes, lighting, and incident zones"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/50"></div> High Incident Area</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500/40"></div> Medium Incident Area</div>
                {isNightTime && <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-200/20"></div> Well-Lit Street</div>}
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-violet-500"></div> Safe Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-violet-500/20 shadow-sm">
            <CardHeader className="bg-violet-50 dark:bg-violet-950/20 pb-4 border-b border-violet-100 dark:border-violet-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-violet-500" />
                    Safety Preferences
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Moon className="w-4 h-4 text-slate-500" />
                    Night Time Mode
                  </label>
                  <p className="text-xs text-muted-foreground">Applies lighting constraints to pathfinder</p>
                </div>
                <Switch 
                  checked={isNightTime}
                  onCheckedChange={setIsNightTime}
                />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    Safety Factor Weight
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">x{safetyWeight[0]}</span>
                </div>
                <Slider 
                  value={safetyWeight} 
                  onValueChange={setSafetyWeight} 
                  min={0} max={10} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Increases the avoidance priority of high-crime zones and unlit streets.</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-violet-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-violet-500' : 'text-red-500'}`} />
                  Security Assessment
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-violet-600 border-violet-200" : ""}>
                  {isSafe ? "Verified Safe" : "HAZARD"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> High-Risk Intersections</span>
                    <span className="font-mono font-medium text-amber-600">{highRiskCount}</span>
                  </div>
                  {isNightTime && (
                    <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                      <span className="text-muted-foreground flex items-center gap-1"><Lightbulb className="w-3 h-3"/> Unlit Segments</span>
                      <span className="font-mono font-medium text-amber-600">{unlitCount}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
