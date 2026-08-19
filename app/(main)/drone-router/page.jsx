"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateAirspaceMap, calculateDroneRoute } from "./_components/drone-algorithm";
import { Plane, Navigation, Map as MapIcon, Wind, ArrowUpCircle, Battery } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function DroneRouterPage() {
  const canvasRef = useRef(null);
  
  const [batteryWeight, setBatteryWeight] = useState([3]); 
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const WIDTH = 40;
  const HEIGHT = 30;
  const MAX_ALTITUDE = 10;
  const CELL_SIZE = 16;

  // Start at ground level, end at high altitude
  const START = { x: 2, y: Math.floor(HEIGHT/2), z: 6 }; 
  const END = { x: WIDTH - 3, y: Math.floor(HEIGHT/2), z: 6 }; 

  const mapData = useMemo(() => {
    return generateAirspaceMap(WIDTH, HEIGHT, MAX_ALTITUDE, 2048); 
  }, [WIDTH, HEIGHT, MAX_ALTITUDE]);

  useEffect(() => {
    const result = calculateDroneRoute(START, END, mapData, MAX_ALTITUDE, batteryWeight[0]);
    setRouteResult(result);
  }, [mapData, batteryWeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        
        // Draw terrain (darker green for higher elevation)
        const elevFactor = node.terrainHeight / MAX_ALTITUDE;
        ctx.fillStyle = `rgb(${20 + elevFactor * 50}, ${100 - elevFactor * 50}, ${30 + elevFactor * 20})`;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw turbulence markers
        if (node.hasTurbulence) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw thermal updraft markers
        if (node.hasThermal) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/4);
            ctx.lineTo(x * CELL_SIZE + CELL_SIZE*0.8, y * CELL_SIZE + CELL_SIZE*0.8);
            ctx.lineTo(x * CELL_SIZE + CELL_SIZE*0.2, y * CELL_SIZE + CELL_SIZE*0.8);
            ctx.fill();
        }
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

    ctx.fillStyle = "#3b82f6"; 
    ctx.beginPath();
    ctx.arc(START.x * CELL_SIZE + CELL_SIZE/2, START.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#10b981"; 
    ctx.beginPath();
    ctx.arc(END.x * CELL_SIZE + CELL_SIZE/2, END.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const path = routeResult.path;
    if (path && path.length > 0) {
      ctx.strokeStyle = "#eab308"; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < path.length; i++) {
        // Color intensity based on altitude (brighter yellow = higher)
        ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      ctx.stroke();
      
      // Draw altitude numbers along path periodically
      ctx.fillStyle = "white";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      for (let i = 0; i < path.length; i += 4) {
          ctx.fillText(`z${path[i].z}`, path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2 - 5);
      }
    }

  }, [mapData, batteryWeight, routeResult]);

  const isSafe = routeResult.path && routeResult.path.length > 0;
  
  // Calculate stats
  let thermalRides = 0;
  let maxAltReached = 0;
  if (isSafe) {
      routeResult.path.forEach(p => {
          if (mapData[p.y][p.x].hasThermal) thermalRides++;
          if (p.z > maxAltReached) maxAltReached = p.z;
      });
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
          <Plane className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">3D Drone Flight Path Optimization</h1>
          <p className="text-muted-foreground">Altitude-variable routing using topography, thermals, and turbulence zones.</p>
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
                aria-label="Interactive map showing 3D drone routes, elevation, thermals, and turbulence"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[8px] border-b-red-500 border-r-[6px] border-r-transparent"></div> Thermal Updraft</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/60"></div> Turbulence Zone</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#1e4a19]"></div> High Elevation</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#14641e]"></div> Low Elevation</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-yellow-500"></div> Flight Path (z=Altitude)</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-yellow-500/20 shadow-sm">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20 pb-4 border-b border-yellow-100 dark:border-yellow-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-yellow-500" />
                    Battery Conservation
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-muted-foreground" />
                    Ascent Energy Cost (Weight)
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{batteryWeight[0]}x</span>
                </div>
                <Slider 
                  value={batteryWeight} 
                  onValueChange={setBatteryWeight} 
                  min={1} max={10} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Higher values force the drone to actively seek thermal updrafts to climb instead of using battery power.</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-yellow-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-yellow-500' : 'text-red-500'}`} />
                  Telemetry
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-yellow-600 border-yellow-200" : ""}>
                  {isSafe ? "Flight Cleared" : "NO PATH"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><ArrowUpCircle className="w-3 h-3"/> Thermals Utilized</span>
                    <span className="font-mono font-medium text-emerald-600">{thermalRides}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Plane className="w-3 h-3"/> Max Altitude (Z)</span>
                    <span className="font-mono font-medium text-amber-600">{maxAltReached}00 ft</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    The path traces 3D space, navigating over topographical obstacles and utilizing wind currents to optimize delivery range.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
