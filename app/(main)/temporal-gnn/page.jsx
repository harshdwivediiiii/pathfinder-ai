"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateTemporalMap, getSamplePath, calculateETAs } from "./_components/gnn-algorithm";
import { Clock, Network, AlertCircle, Activity, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function TemporalGNNPage() {
  const canvasRef = useRef(null);
  
  const [timeOfDay, setTimeOfDay] = useState([12.0]); // 12:00 PM
  const [etas, setEtas] = useState({ heuristicETA: 0, tgnnETA: 0 });

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 14;

  const START = { x: 5, y: 5 }; 
  const END = { x: 35, y: 25 }; 

  const mapData = useMemo(() => {
    return generateTemporalMap(WIDTH, HEIGHT, 2048); 
  }, [WIDTH, HEIGHT]);
  
  const path = useMemo(() => {
      return getSamplePath(START.x, START.y, END.x, END.y);
  }, []);

  useEffect(() => {
    const result = calculateETAs(path, mapData, timeOfDay[0]);
    setEtas(result);
  }, [mapData, path, timeOfDay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // Rush hour peak is at 17.5 (5:30 PM)
    const distanceToRushHour = Math.abs(timeOfDay[0] - 17.5);
    let severity = 0;
    if (distanceToRushHour < 3.0) {
        severity = Math.pow(1 - (distanceToRushHour / 3.0), 2);
    }

    // Draw base map
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        
        ctx.fillStyle = "#0f172a";
        
        if (node.isArterial) {
            // Arterials get visibly congested based on time of day
            if (severity > 0.1) {
                // Blend from gray to red
                const r = Math.floor(51 + (severity * 188)); // 51 to 239
                const g = Math.floor(65 - (severity * 0));
                const b = Math.floor(85 - (severity * 17));
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            } else {
                ctx.fillStyle = "#334155";
            }
        }
        
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Grid lines
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw Start & End points
    ctx.fillStyle = "#3b82f6"; 
    ctx.beginPath();
    ctx.arc(START.x * CELL_SIZE + CELL_SIZE/2, START.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#10b981"; 
    ctx.beginPath();
    ctx.arc(END.x * CELL_SIZE + CELL_SIZE/2, END.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Draw Path
    if (path && path.length > 0) {
      
      ctx.beginPath();
      ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < path.length; i++) {
        const curr = path[i];
        ctx.lineTo(curr.x * CELL_SIZE + CELL_SIZE/2, curr.y * CELL_SIZE + CELL_SIZE/2);
      }
      
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#3b82f6"; // Blue path line
      ctx.stroke();
    }

  }, [mapData, path, timeOfDay]);

  // Format time of day
  const formatTime = (val) => {
      const h = Math.floor(val);
      const m = Math.round((val - h) * 60);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  
  const isRushHour = timeOfDay[0] >= 16.0 && timeOfDay[0] <= 19.0;
  const etaDiff = etas.tgnnETA - etas.heuristicETA;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-xl">
          <Network className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Temporal GNN ETA Prediction</h1>
          <p className="text-muted-foreground">Neural network topology that learns non-linear spatio-temporal traffic propagation to generate hyper-accurate ETAs.</p>
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
                aria-label="Interactive map showing spatial traffic congestion"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-900 border border-slate-700"></div> Local Road (Low Traffic)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-700"></div> Major Arterial (Flowing)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500"></div> Major Arterial (Congested)</div>
                <div className="w-full h-px bg-border my-1"></div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500"></div> Vehicle Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-fuchsia-500/20 shadow-sm">
            <CardHeader className="bg-fuchsia-50 dark:bg-fuchsia-950/20 pb-4 border-b border-fuchsia-100 dark:border-fuchsia-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-fuchsia-500" />
                    Temporal Simulator
                </div>
                <Badge variant={isRushHour ? "destructive" : "secondary"}>
                    {isRushHour ? "RUSH HOUR" : "OFF-PEAK"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Time of Day</label>
                      <span className="font-mono font-bold text-fuchsia-600">{formatTime(timeOfDay[0])}</span>
                  </div>
                  <Slider 
                      defaultValue={[12.0]} 
                      max={23.9} 
                      step={0.1} 
                      onValueChange={setTimeOfDay}
                      className="[&_[role=slider]]:bg-fuchsia-500 [&_[role=slider]]:border-fuchsia-600"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>12 AM</span>
                      <span>12 PM</span>
                      <span>11 PM</span>
                  </div>
              </div>

            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-fuchsia-500" />
                  ETA Prediction Model
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1">Legacy Heuristic</span>
                    <span className="font-mono font-medium text-slate-500">{etas.heuristicETA} mins</span>
                  </div>
                  
                  <div className="flex justify-between text-sm items-center p-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-md">
                    <span className="text-fuchsia-700 dark:text-fuchsia-400 font-semibold flex items-center gap-1">T-GNN Output</span>
                    <span className="font-mono font-bold text-fuchsia-600">{etas.tgnnETA} mins</span>
                  </div>
                  
                  {isRushHour && etaDiff > 10 && (
                      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md flex gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                              Heuristic model is underestimating the ETA by {etaDiff} minutes because it applies a flat multiplier. The T-GNN identifies non-linear spatial gridlock on the arterials.
                          </p>
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
