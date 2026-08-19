"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateMultimodalMap, calculateMultimodalRoute } from "./_components/multimodal-algorithm";
import { TrainFront, Bike, Navigation, Map as MapIcon, Footprints, Repeat, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function MultimodalRouterPage() {
  const canvasRef = useRef(null);
  
  const [allowBikes, setAllowBikes] = useState(true); 
  const [allowTransit, setAllowTransit] = useState(true); 
  
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 14;

  const START = { x: 2, y: HEIGHT - 3 }; 
  const END = { x: WIDTH - 3, y: 2 }; 

  const mapData = useMemo(() => {
    return generateMultimodalMap(WIDTH, HEIGHT, 2048); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculateMultimodalRoute(START, END, mapData, allowBikes, allowTransit);
    setRouteResult(result);
  }, [mapData, allowBikes, allowTransit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // Draw base map
    ctx.fillStyle = "#1e293b"; // Walkable space
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        
        if (node.isBikeLane) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        if (node.isTransitLine) {
            ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        if (node.isTransitStation) {
            ctx.fillStyle = "#8b5cf6";
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.4, 0, Math.PI*2);
            ctx.fill();
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

    ctx.fillStyle = "#f43f5e"; 
    ctx.beginPath();
    ctx.arc(END.x * CELL_SIZE + CELL_SIZE/2, END.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const path = routeResult.path;
    if (path && path.length > 0) {
      
      // Draw path segments based on mode
      ctx.lineWidth = 3;
      
      let prev = path[0];
      for (let i = 1; i < path.length; i++) {
        const curr = path[i];
        
        ctx.beginPath();
        ctx.moveTo(prev.x * CELL_SIZE + CELL_SIZE/2, prev.y * CELL_SIZE + CELL_SIZE/2);
        ctx.lineTo(curr.x * CELL_SIZE + CELL_SIZE/2, curr.y * CELL_SIZE + CELL_SIZE/2);
        
        if (curr.mode === 0) { // WALK
            ctx.strokeStyle = "#94a3b8"; // Gray
            ctx.setLineDash([4, 4]);
        } else if (curr.mode === 1) { // BIKE
            ctx.strokeStyle = "#10b981"; // Emerald
            ctx.setLineDash([]);
        } else if (curr.mode === 2) { // TRANSIT
            ctx.strokeStyle = "#8b5cf6"; // Purple
            ctx.setLineDash([]);
            ctx.lineWidth = 5; // thicker for train
        }
        
        ctx.stroke();
        ctx.lineWidth = 3; // reset
        
        // Draw transfer nodes
        if (curr.mode !== prev.mode) {
             ctx.fillStyle = "#f59e0b"; // amber dot for transfer
             ctx.beginPath();
             ctx.arc(curr.x * CELL_SIZE + CELL_SIZE/2, curr.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.5, 0, Math.PI*2);
             ctx.fill();
             ctx.setLineDash([]);
             ctx.stroke();
        }
        
        prev = curr;
      }
      ctx.setLineDash([]);
    }

  }, [mapData, allowBikes, allowTransit, routeResult]);

  const isComplete = routeResult.path && routeResult.path.length > 0;
  
  // Calculate stats
  let walkBlocks = 0;
  let bikeBlocks = 0;
  let transitBlocks = 0;
  let transfers = 0;
  
  if (isComplete) {
      let prevMode = routeResult.path[0].mode;
      routeResult.path.forEach((p, i) => {
          if (i === 0) return;
          if (p.mode === 0) walkBlocks++;
          else if (p.mode === 1) bikeBlocks++;
          else if (p.mode === 2) transitBlocks++;
          
          if (p.mode !== prevMode) {
              transfers++;
              prevMode = p.mode;
          }
      });
  }
  
  // Rough time estimate
  const totalTime = (walkBlocks * 1.0) + (bikeBlocks * 0.33) + (transitBlocks * 0.1) + (transfers * 1.5);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Layers className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multimodal Transit Pathing</h1>
          <p className="text-muted-foreground">Seamlessly stitches together micro-mobility, public transit, and walking for the optimal commute.</p>
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
                aria-label="Interactive map showing mixed-mode transit routes"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-0 border-t-2 border-dashed border-slate-400"></div> Walk (Base Speed)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-emerald-500"></div> Bike Share (3x Speed)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1.5 bg-purple-500"></div> Metro Train (10x Speed)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Mode Transfer Node</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-indigo-500/20 shadow-sm">
            <CardHeader className="bg-indigo-50 dark:bg-indigo-950/20 pb-4 border-b border-indigo-100 dark:border-indigo-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-indigo-500" />
                    Commute Preferences
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Bike className="w-4 h-4 text-emerald-500" /> Use Bike Shares
                  </label>
                  <p className="text-xs text-muted-foreground w-48">Allow routing via active bike lanes.</p>
                </div>
                <Switch 
                  checked={allowBikes}
                  onCheckedChange={setAllowBikes}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <TrainFront className="w-4 h-4 text-purple-500" /> Use Public Transit
                  </label>
                  <p className="text-xs text-muted-foreground w-48">Allow routing via rail and bus lines.</p>
                </div>
                <Switch 
                  checked={allowTransit}
                  onCheckedChange={setAllowTransit}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isComplete ? 'border-indigo-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-indigo-500" />
                  Trip Itinerary
                </div>
                <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30">
                  {totalTime.toFixed(1)} mins
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Footprints className="w-3 h-3"/> Walking Dist</span>
                    <span className="font-mono font-medium text-slate-500">{walkBlocks} blks</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Bike className="w-3 h-3"/> Cycling Dist</span>
                    <span className="font-mono font-medium text-emerald-600">{bikeBlocks} blks</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><TrainFront className="w-3 h-3"/> Transit Dist</span>
                    <span className="font-mono font-medium text-purple-600">{transitBlocks} blks</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md border border-amber-500/20">
                    <span className="text-muted-foreground flex items-center gap-1"><Repeat className="w-3 h-3"/> Total Transfers</span>
                    <span className="font-mono font-medium text-amber-600">{transfers}</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
