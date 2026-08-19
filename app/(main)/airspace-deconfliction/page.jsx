"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateAirspaceMap, calculate3DAirspaceRoute } from "./_components/airspace-algorithm";
import { Plane, Building2, Wind, Navigation, Map as MapIcon, VolumeX, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function AirspaceDeconflictionPage() {
  const canvasRef = useRef(null);
  
  const [enforceNoiseLimits, setEnforceNoiseLimits] = useState(true); 
  const [route, setRoute] = useState([]);

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 14;
  const MAX_ALTITUDE = 10;

  const START = { x: 2, y: 35, z: MAX_ALTITUDE - 1 }; 
  const END = { x: 35, y: 5, z: 1 }; // landing on a low helipad

  const mapData = useMemo(() => {
    return generateAirspaceMap(WIDTH, HEIGHT, MAX_ALTITUDE, 2048); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculate3DAirspaceRoute(START, END, mapData, MAX_ALTITUDE, enforceNoiseLimits);
    setRoute(result || []);
  }, [mapData, enforceNoiseLimits]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // Draw base map (Residential vs Commercial)
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        
        if (node.isResidential) {
            ctx.fillStyle = "#1e293b"; // Dark slate for residential
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
            ctx.fillStyle = "#0f172a"; // Even darker for commercial
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        // Draw Buildings
        if (node.buildingHeight > 0) {
            // Color based on height
            const intensity = Math.floor((node.buildingHeight / MAX_ALTITUDE) * 150) + 50;
            ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
            ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            
            ctx.fillStyle = "#fff";
            ctx.font = "8px sans-serif";
            ctx.fillText(`h${node.buildingHeight}`, x * CELL_SIZE + 2, y * CELL_SIZE + 10);
        }
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

    // Draw Path with 3D Altitude Representation
    if (route && route.length > 0) {
      
      let prev = route[0];
      for (let i = 1; i < route.length; i++) {
        const curr = route[i];
        
        ctx.beginPath();
        ctx.moveTo(prev.x * CELL_SIZE + CELL_SIZE/2, prev.y * CELL_SIZE + CELL_SIZE/2);
        ctx.lineTo(curr.x * CELL_SIZE + CELL_SIZE/2, curr.y * CELL_SIZE + CELL_SIZE/2);
        
        // Line thickness and color based on altitude (z)
        // High altitude = thick, cyan. Low altitude = thin, deep blue
        const altRatio = curr.z / MAX_ALTITUDE;
        
        ctx.lineWidth = Math.max(1, altRatio * 6);
        
        // Blend from dark blue to bright cyan
        const r = Math.floor(14 * (1 - altRatio) + 34 * altRatio);
        const g = Math.floor(165 * (1 - altRatio) + 211 * altRatio);
        const b = Math.floor(233 * (1 - altRatio) + 238 * altRatio);
        
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.stroke();
        
        prev = curr;
      }
    }

  }, [mapData, enforceNoiseLimits, route]);
  
  // Calculate max altitude reached and noise zones crossed
  let peakAltitude = 0;
  let residentialCrossings = 0;
  
  if (route && route.length > 0) {
      route.forEach(node => {
          if (node.z > peakAltitude) peakAltitude = node.z;
          if (mapData[node.y][node.x].isResidential) residentialCrossings++;
      });
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
          <Plane className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">3D Airspace Deconfliction</h1>
          <p className="text-muted-foreground">Volumetric routing for UAM (eVTOL) fleets, navigating skyscrapers and residential noise abatement zones.</p>
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
                aria-label="Interactive map showing 3D flight paths"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-400"></div> Physical Obstacle (h1-9)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800"></div> Residential Zone</div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-cyan-300"></div> High Altitude Flight
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-800"></div> Low Altitude Flight
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-cyan-500/20 shadow-sm">
            <CardHeader className="bg-cyan-50 dark:bg-cyan-950/20 pb-4 border-b border-cyan-100 dark:border-cyan-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-cyan-500" />
                    ATC Directives
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-emerald-500" /> Enforce Noise Abatement
                  </label>
                  <p className="text-xs text-muted-foreground w-48">Force aircraft to ascend to high altitudes when crossing residential airspace.</p>
                </div>
                <Switch 
                  checked={enforceNoiseLimits}
                  onCheckedChange={setEnforceNoiseLimits}
                  className="data-[state=checked]:bg-cyan-600"
                />
              </div>

            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-500" />
                  Flight Telemetry
                </div>
                <Badge variant="outline" className="text-cyan-600 border-cyan-200 bg-cyan-50 dark:bg-cyan-950/30">
                  Cleared
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3"/> Peak Altitude</span>
                    <span className="font-mono font-medium text-cyan-600">Level {peakAltitude}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><VolumeX className="w-3 h-3"/> Res. Crossings</span>
                    <span className="font-mono font-medium text-emerald-600">{residentialCrossings} blocks</span>
                  </div>
                  
                  {enforceNoiseLimits ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 pt-2 font-medium">
                          Aircraft is correctly ascending over residential zones, sacrificing energy efficiency to maintain urban noise compliance.
                      </p>
                  ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-500 pt-2 font-medium">
                          Warning: Aircraft is skimming at low altitudes over residential sectors. Noise violations probable.
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
