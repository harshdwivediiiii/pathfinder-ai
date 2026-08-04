"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateEvacuationMap, calculateEvacuationRoutes } from "./_components/evacuation-algorithm";
import { Siren, Users, Navigation, Map as MapIcon, Activity, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function EvacuationRouterPage() {
  const canvasRef = useRef(null);
  
  const [enableLoadBalancing, setEnableLoadBalancing] = useState(true); 
  const [simulationData, setSimulationData] = useState({ routes: [], simMap: [] });

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 12;

  const baseMapData = useMemo(() => {
    return generateEvacuationMap(WIDTH, HEIGHT, 1024); 
  }, [WIDTH, HEIGHT]);

  // Generate 150 vehicles starting in the center "danger zone"
  const vehicles = useMemo(() => {
     const v = [];
     for(let i=0; i<150; i++){
         v.push({
             x: Math.floor(WIDTH/2) + (Math.floor(Math.random() * 8) - 4),
             y: Math.floor(HEIGHT/2) + (Math.floor(Math.random() * 8) - 4),
         });
     }
     return v;
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculateEvacuationRoutes(baseMapData, vehicles, enableLoadBalancing);
    setSimulationData(result);
  }, [baseMapData, vehicles, enableLoadBalancing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);
    
    const simMap = simulationData.simMap;
    if (!simMap || simMap.length === 0) return;

    // Draw base map
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // Draw Highways and Local Roads
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = simMap[y][x];
        
        if (node.isHighway) {
            ctx.fillStyle = "#334155";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
    
    // Draw Danger Zone
    ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
    ctx.beginPath();
    ctx.arc(WIDTH/2 * CELL_SIZE, HEIGHT/2 * CELL_SIZE, CELL_SIZE * 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw Routes with Congestion Heatmap
    const routes = simulationData.routes;
    
    // Calculate max load for color scaling
    let maxLoad = 1;
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
         if (simMap[y][x].currentLoad > maxLoad) {
             maxLoad = simMap[y][x].currentLoad;
         }
      }
    }

    ctx.lineWidth = 2;
    routes.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
        
        for (let i = 1; i < path.length; i++) {
            const p = path[i];
            ctx.lineTo(p.x * CELL_SIZE + CELL_SIZE/2, p.y * CELL_SIZE + CELL_SIZE/2);
        }
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"; 
        ctx.stroke();
    });
    
    // Overlay heat for used nodes
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
         const load = simMap[y][x].currentLoad;
         const capacity = simMap[y][x].capacity;
         
         if (load > 0) {
             const loadFactor = load / capacity;
             
             // Blue -> Purple -> Red -> Bright Yellow based on load factor
             let color = `rgba(59, 130, 246, 0.8)`; // Safe flow (blue)
             if (loadFactor > 0.5) color = `rgba(168, 85, 247, 0.9)`; // Heavy flow (purple)
             if (loadFactor >= 1.0) color = `rgba(239, 68, 68, 0.95)`; // Gridlock (red)
             if (loadFactor > 1.5) color = `rgba(234, 179, 8, 1.0)`; // Severe Gridlock (yellow)
             
             ctx.fillStyle = color;
             
             // Draw a small dot or square depending on highway vs local
             const size = simMap[y][x].isHighway ? CELL_SIZE * 0.6 : CELL_SIZE * 0.4;
             ctx.fillRect(x * CELL_SIZE + (CELL_SIZE - size)/2, y * CELL_SIZE + (CELL_SIZE - size)/2, size, size);
         }
      }
    }

  }, [simulationData]);

  let bottleneckCount = 0;
  if (simulationData.simMap.length > 0) {
      for (let y = 0; y < HEIGHT; y++) {
          for (let x = 0; x < WIDTH; x++) {
             if (simulationData.simMap[y][x].currentLoad >= simulationData.simMap[y][x].capacity) {
                 bottleneckCount++;
             }
          }
      }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <Siren className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Macroscopic Evacuation Routing</h1>
          <p className="text-muted-foreground">Dynamic load-balancing to prevent highway gridlock during large-scale disasters.</p>
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
                aria-label="Interactive map showing evacuation paths and congestion heatmaps"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500"></div> Flowing Traffic</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500"></div> Heavy Load</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500"></div> Gridlock Bottleneck</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500"></div> Severe Gridlock</div>
                <div className="w-full h-px bg-border my-1"></div>
                <div className="flex items-center gap-2 text-red-500/80"><Flame className="w-3 h-3"/> Origin Danger Zone</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-red-500/20 shadow-sm">
            <CardHeader className="bg-red-50 dark:bg-red-950/20 pb-4 border-b border-red-100 dark:border-red-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    Traffic Management
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Dynamic Load Balancing</label>
                  <p className="text-xs text-muted-foreground w-48">Divert fleeing traffic to secondary roads as highways reach maximum capacity.</p>
                </div>
                <Switch 
                  checked={enableLoadBalancing}
                  onCheckedChange={setEnableLoadBalancing}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${bottleneckCount < 20 ? 'border-emerald-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${bottleneckCount < 20 ? 'text-emerald-500' : 'text-red-500'}`} />
                  Simulation Metrics
                </div>
                <Badge variant={bottleneckCount < 20 ? "outline" : "destructive"} className={bottleneckCount < 20 ? "text-emerald-600 border-emerald-200" : ""}>
                  {bottleneckCount < 20 ? "Evacuation Successful" : "GRIDLOCK DETECTED"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3"/> Active Vehicles</span>
                    <span className="font-mono font-medium text-blue-600">150</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Siren className="w-3 h-3"/> Gridlocked Nodes</span>
                    <span className={`font-mono font-medium ${bottleneckCount < 20 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {bottleneckCount} critical
                    </span>
                  </div>
                  
                  {!enableLoadBalancing && (
                      <p className="text-xs text-red-500 mt-2 font-medium">
                          Warning: Vehicles are exclusively utilizing highways, resulting in catastrophic failure of the road network capacity.
                      </p>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
