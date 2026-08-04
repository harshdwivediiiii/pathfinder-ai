"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateAnomalyMap, calculatePotholeRoute } from "./_components/pothole-algorithm";
import { AlertCircle, Navigation, Map as MapIcon, Car, Wrench, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function PotholeRouterPage() {
  const canvasRef = useRef(null);
  
  const [sensitivity, setSensitivity] = useState([5]); 
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const WIDTH = 45;
  const HEIGHT = 45;
  const CELL_SIZE = 10;

  const START = { x: 3, y: HEIGHT - 4 }; 
  const END = { x: WIDTH - 4, y: 3 }; 

  const mapData = useMemo(() => {
    return generateAnomalyMap(WIDTH, HEIGHT, 4096); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculatePotholeRoute(START, END, mapData, sensitivity[0]);
    setRouteResult(result);
  }, [mapData, sensitivity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // Draw base asphalt
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        
        // Draw anomalies
        if (node.anomalyType === 'crater') {
            ctx.fillStyle = "#ef4444"; // Red for severe
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (node.anomalyType === 'pothole') {
            ctx.fillStyle = "#f59e0b"; // Orange for moderate
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (node.anomalyType === 'rough') {
            ctx.fillStyle = "#eab308"; // Yellow for minor
            ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
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
      ctx.strokeStyle = "#14b8a6"; // Teal path
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      ctx.stroke();
    }

  }, [mapData, sensitivity, routeResult]);

  const isSafe = routeResult.path && routeResult.path.length > 0;
  
  // Calculate stats
  let totalDamageRisk = 0;
  let severeEncounters = 0;
  if (isSafe) {
      routeResult.path.forEach(p => {
          const node = mapData[p.y][p.x];
          totalDamageRisk += node.severity;
          if (node.anomalyType === 'crater') severeEncounters++;
      });
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
          <AlertCircle className="w-8 h-8 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Computer Vision-Based Road Anomaly Routing</h1>
          <p className="text-muted-foreground">Self-healing maps that route vehicles around crowdsourced edge-AI pothole detections.</p>
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
                aria-label="Interactive map showing routes avoiding road anomalies"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Crater (Severe Risk)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Pothole (Moderate Risk)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500"></div> Rough Surface</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-teal-500"></div> Preservation Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-teal-500/20 shadow-sm">
            <CardHeader className="bg-teal-50 dark:bg-teal-950/20 pb-4 border-b border-teal-100 dark:border-teal-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-500" />
                    Vehicle Protection
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    Suspension Sensitivity
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{sensitivity[0]}x Penalty</span>
                </div>
                <Slider 
                  value={sensitivity} 
                  onValueChange={setSensitivity} 
                  min={0} max={20} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Adjust how sensitive your vehicle is to road anomalies. Sports cars (high) will detour aggressively to avoid any bumps.</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-teal-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-teal-500' : 'text-red-500'}`} />
                  Chassis Assessment
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-teal-600 border-teal-200" : ""}>
                  {isSafe ? "Route Validated" : "DAMAGING"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Cumulative Wear</span>
                    <span className="font-mono font-medium text-amber-600">{totalDamageRisk} severity</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Wrench className="w-3 h-3"/> Crater Impacts</span>
                    <span className="font-mono font-medium text-rose-600">{severeEncounters}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><MapIcon className="w-3 h-3"/> Detour Distance</span>
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
