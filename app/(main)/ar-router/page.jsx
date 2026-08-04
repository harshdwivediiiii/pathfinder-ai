"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateIndoorMap, calculateARRoute } from "./_components/ar-algorithm";
import { Camera, Navigation, Map as MapIcon, Eye, Building2, Footprints } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ARRouterPage() {
  const canvasRef = useRef(null);
  
  const [currentFloor, setCurrentFloor] = useState(0);
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const WIDTH = 40;
  const HEIGHT = 40;
  const FLOORS = 3;
  const CELL_SIZE = 12;

  // Start on floor 0, end on floor 2
  const START = { x: 5, y: HEIGHT - 5, f: 0 }; 
  const END = { x: WIDTH - 5, y: 5, f: 2 }; 

  const mapData = useMemo(() => {
    return generateIndoorMap(WIDTH, HEIGHT, FLOORS, 2048); 
  }, [WIDTH, HEIGHT, FLOORS]);

  useEffect(() => {
    const result = calculateARRoute(START, END, mapData);
    setRouteResult(result);
  }, [mapData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[currentFloor][y][x];
        
        if (node.wall) {
          ctx.fillStyle = "#334155"; // Wall color
        } else if (node.stairs) {
          ctx.fillStyle = "#f59e0b"; // Stairs color
        } else {
          ctx.fillStyle = "#f1f5f9"; // Hallway color
        }
        
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    ctx.strokeStyle = "rgba(0,0,0,0.1)";
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

    // Draw Start if on current floor
    if (START.f === currentFloor) {
        ctx.fillStyle = "#3b82f6"; 
        ctx.beginPath();
        ctx.arc(START.x * CELL_SIZE + CELL_SIZE/2, START.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw End if on current floor
    if (END.f === currentFloor) {
        ctx.fillStyle = "#10b981"; 
        ctx.beginPath();
        ctx.arc(END.x * CELL_SIZE + CELL_SIZE/2, END.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw Path for current floor
    const path = routeResult.path;
    if (path && path.length > 0) {
      ctx.strokeStyle = "#ec4899"; // Pink AR overlay path
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      let started = false;
      for (let i = 0; i < path.length; i++) {
        if (path[i].f === currentFloor) {
          if (!started) {
            ctx.moveTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
            started = true;
          } else {
            ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

  }, [mapData, currentFloor, routeResult]);

  const isSafe = routeResult.path && routeResult.path.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
          <Eye className="w-8 h-8 text-pink-600 dark:text-pink-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AR Indoor Navigational Overlays</h1>
          <p className="text-muted-foreground">Pathfinding with Visual Positioning Systems (VPS) for complex indoor environments.</p>
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
                className="bg-slate-800 rounded-md shadow-inner"
                style={{ width: WIDTH * CELL_SIZE, height: HEIGHT * CELL_SIZE }}
                aria-label="Interactive map showing indoor AR routes, walls, stairs, and endpoints"
              />
              
              <div className="absolute top-6 left-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Select Floor</span>
                {[0, 1, 2].map(f => (
                  <Button 
                    key={f}
                    variant={currentFloor === f ? "default" : "outline"}
                    size="sm"
                    className={currentFloor === f ? "bg-pink-600 hover:bg-pink-700 text-white" : ""}
                    onClick={() => setCurrentFloor(f)}
                  >
                    Floor {f}
                  </Button>
                ))}
              </div>

              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#334155]"></div> Wall / Obstacle</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#f1f5f9]"></div> Hallway</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#f59e0b]"></div> Stairs / Elevator</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-pink-500"></div> AR Overlay Path</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-pink-500/20 shadow-sm">
            <CardHeader className="bg-pink-50 dark:bg-pink-950/20 pb-4 border-b border-pink-100 dark:border-pink-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-500" />
                AR Environment View
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Using device IMU sensors and camera feed, we overlay these waypoints onto the physical environment.
              </p>
              
              <div className="aspect-video bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center mix-blend-luminosity"></div>
                
                {/* Simulated AR Waypoint */}
                <div className="relative z-10 flex flex-col items-center animate-bounce mt-10">
                  <div className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white/20 mb-1">
                    50m Ahead
                  </div>
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-pink-500 border-r-[10px] border-r-transparent"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-pink-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-pink-500' : 'text-red-500'}`} />
                  Nav Status
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-pink-600 border-pink-200" : ""}>
                  {isSafe ? "Tracking Active" : "LOST"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><Footprints className="w-3 h-3"/> Total Steps</span>
                    <span className="font-mono font-medium">{routeResult.path.length * 2}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3"/> Floors Traversed</span>
                    <span className="font-mono font-medium">{Math.abs(END.f - START.f)}</span>
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
