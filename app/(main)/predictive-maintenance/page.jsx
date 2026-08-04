"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateMaintenanceMap, calculatePredictiveMaintenanceRoute } from "./_components/maintenance-algorithm";
import { Wrench, Car, TriangleAlert, Navigation, Activity, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function PredictiveMaintenancePage() {
  const canvasRef = useRef(null);
  
  const [faultDetected, setFaultDetected] = useState(false); 
  const [route, setRoute] = useState([]);

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 14;

  const START = { x: 5, y: 5 }; 
  const DESTINATION = { x: 35, y: 35 }; 

  const { mapData, serviceCenters } = useMemo(() => {
    return generateMaintenanceMap(WIDTH, HEIGHT, 1024); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculatePredictiveMaintenanceRoute(START, DESTINATION, faultDetected, mapData, serviceCenters);
    setRoute(result || []);
  }, [mapData, serviceCenters, faultDetected]);

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
        
        if (node.isHighway) {
            ctx.fillStyle = "#334155";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            // Draw lane markings
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.fillRect(x * CELL_SIZE + CELL_SIZE/2 - 1, y * CELL_SIZE + CELL_SIZE/2 - 1, 2, 2);
        } else {
            // Local roads outline
            ctx.strokeStyle = "rgba(255,255,255,0.03)";
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        if (node.isServiceCenter) {
            ctx.fillStyle = "#0284c7"; // Sky blue
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = "#fff";
            ctx.font = "10px sans-serif";
            ctx.fillText("🔧", x * CELL_SIZE + 2, y * CELL_SIZE + 10);
        }
      }
    }

    // Draw Start
    ctx.fillStyle = faultDetected ? "#f59e0b" : "#3b82f6"; // Amber if fault, blue if normal
    ctx.beginPath();
    ctx.arc(START.x * CELL_SIZE + CELL_SIZE/2, START.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Draw Destination (only if not fault)
    if (!faultDetected) {
        ctx.fillStyle = "#10b981"; 
        ctx.beginPath();
        ctx.arc(DESTINATION.x * CELL_SIZE + CELL_SIZE/2, DESTINATION.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Path
    if (route && route.length > 0) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(route[0].x * CELL_SIZE + CELL_SIZE/2, route[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < route.length; i++) {
        ctx.lineTo(route[i].x * CELL_SIZE + CELL_SIZE/2, route[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      
      ctx.strokeStyle = faultDetected ? "#f59e0b" : "#3b82f6"; // Amber path vs Blue path
      
      // If fault detected, make the path dashed to indicate "limp mode"
      if (faultDetected) {
          ctx.setLineDash([4, 4]);
      } else {
          ctx.setLineDash([]);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [mapData, serviceCenters, faultDetected, route]);

  // Telemetry processing
  let usesHighway = false;
  if (route && route.length > 0) {
      route.forEach(node => {
          if (mapData[node.y][node.x].isHighway) usesHighway = true;
      });
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
          <Wrench className="w-8 h-8 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictive Maintenance Routing</h1>
          <p className="text-muted-foreground">Autonomous fleet AI that dynamic reroutes to service centers via low-stress paths upon detecting mechanical anomalies.</p>
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
                aria-label="Interactive map showing normal vs maintenance routes"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-700"></div> High-Stress Highway</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 border border-slate-700"></div> Low-Stress Local Road</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-500"></div> Fleet Service Center</div>
                <div className="w-full h-px bg-border my-1"></div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500"></div> Optimal Speed Route</div>
                <div className="flex items-center gap-2"><div className="w-3 h-0 border-t-2 border-dashed border-amber-500"></div> Limp-Mode Reroute</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={`border shadow-sm transition-colors ${faultDetected ? 'border-amber-500/50 bg-amber-50/10 dark:bg-amber-950/20' : 'border-sky-500/20'}`}>
            <CardHeader className={`${faultDetected ? 'bg-amber-500/10 border-b border-amber-500/20' : 'bg-sky-50 dark:bg-sky-950/20 border-b border-sky-100 dark:border-sky-900/30'} pb-4`}>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${faultDetected ? 'text-amber-500' : 'text-sky-500'}`} />
                    Vehicle Diagnostics
                </div>
                {faultDetected && (
                    <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 animate-pulse">
                        FAULT ACTIVE
                    </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <TriangleAlert className="w-4 h-4 text-amber-500" /> Overheating Transmission
                  </label>
                  <p className="text-xs text-muted-foreground w-48">Trigger simulated mechanical failure requiring immediate service.</p>
                </div>
                <Switch 
                  checked={faultDetected}
                  onCheckedChange={setFaultDetected}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-slate-500" />
                  Routing State
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Navigation className="w-3 h-3"/> Destination</span>
                    <span className={`font-mono font-medium ${faultDetected ? 'text-sky-500' : 'text-emerald-500'}`}>
                        {faultDetected ? 'Nearest Service Depot' : 'Passenger Drop-off'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3"/> Route Profile</span>
                    <span className={`font-mono font-medium ${usesHighway ? 'text-blue-500' : 'text-emerald-500'}`}>
                        {usesHighway ? 'Time-Optimized (Highways)' : 'Low-Stress (Local Only)'}
                    </span>
                  </div>
                  
                  {faultDetected && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 pt-2 font-medium">
                          Rerouting via local roads. Avoiding high-speed highways to prevent catastrophic mechanical failure before reaching the depot.
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
