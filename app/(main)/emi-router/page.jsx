"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generatePowerLines, calculateEmiRadius, calculateInspectionRoute } from "./_components/emi-algorithm";
import { Zap, CloudRain, ShieldAlert, Plane, Activity, UtilityPole } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function EmiRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [voltage, setVoltage] = useState([500]); // kV
  const [humidity, setHumidity] = useState([40]); // %
  
  // Grid Configuration
  const width = 800;
  const height = 400;

  // Static towers for simulation
  const startTower = { x: 100, y: 150 };
  const endTower = { x: 700, y: 150 };
  const targetStandoff = 30; // Desired camera distance in pixels

  // Recalculate physics when inputs change
  const { wirePoints, emiRadius, flightPath } = useMemo(() => {
    const wire = generatePowerLines(startTower, endTower, 60);
    const radius = calculateEmiRadius(voltage[0], humidity[0]);
    const path = calculateInspectionRoute(wire, radius, targetStandoff);
    
    return { wirePoints: wire, emiRadius: radius, flightPath: path };
  }, [voltage, humidity]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Sky Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    // Darker/stormier sky if humidity is high
    if (humidity[0] > 70) {
      bgGradient.addColorStop(0, "#475569"); // Slate 600
      bgGradient.addColorStop(1, "#94a3b8"); // Slate 400
    } else {
      bgGradient.addColorStop(0, "#bae6fd"); // Sky 200
      bgGradient.addColorStop(1, "#e0f2fe"); // Sky 100
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Ground
    ctx.fillStyle = "#166534"; // Green 800
    ctx.fillRect(0, height - 40, width, 40);

    // Helper to draw transmission towers
    const drawTower = (x, y) => {
      ctx.strokeStyle = "#334155"; // Slate 700
      ctx.lineWidth = 4;
      
      // Main central mast
      ctx.beginPath();
      ctx.moveTo(x, y - 20); // Top
      ctx.lineTo(x, height - 40); // Base
      ctx.stroke();
      
      // Crossarms
      ctx.beginPath();
      ctx.moveTo(x - 30, y);
      ctx.lineTo(x + 30, y);
      ctx.stroke();
      
      // Diagonal bracing (simplified)
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 20, height - 40);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 20, height - 40);
      ctx.stroke();
      
      // Insulators
      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.fillRect(x - 5, y, 10, 15);
    };

    drawTower(startTower.x, startTower.y - 15);
    drawTower(endTower.x, endTower.y - 15);

    // Draw EMI Danger Zone (Semi-transparent red cylinder around the wire)
    ctx.beginPath();
    ctx.moveTo(wirePoints[0].x, wirePoints[0].y);
    for (let i = 1; i < wirePoints.length; i++) {
      ctx.lineTo(wirePoints[i].x, wirePoints[i].y);
    }
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.1 + (voltage[0]/2000)})`; // Red, opacity scales with voltage
    ctx.lineWidth = emiRadius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Draw the actual physical power line
    ctx.beginPath();
    ctx.moveTo(wirePoints[0].x, wirePoints[0].y);
    for (let i = 1; i < wirePoints.length; i++) {
      ctx.lineTo(wirePoints[i].x, wirePoints[i].y);
    }
    ctx.strokeStyle = "#1e293b"; // Slate 800
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Drone Flight Path
    ctx.beginPath();
    ctx.moveTo(flightPath[0].x, flightPath[0].y);
    for (let i = 1; i < flightPath.length; i++) {
      ctx.lineTo(flightPath[i].x, flightPath[i].y);
    }
    ctx.strokeStyle = "#38bdf8"; // Sky blue
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
    
    // Draw the Drone (at the middle of the path)
    const midIndex = Math.floor(flightPath.length / 2);
    const dronePt = flightPath[midIndex];
    
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(dronePt.x - 10, dronePt.y - 4, 20, 8); // Drone body
    ctx.fillStyle = "#f59e0b"; // Amber light
    ctx.beginPath();
    ctx.arc(dronePt.x, dronePt.y + 4, 3, 0, Math.PI * 2); // Camera payload
    ctx.fill();
    // Propellers
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(dronePt.x - 12, dronePt.y - 4); ctx.lineTo(dronePt.x - 6, dronePt.y - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dronePt.x + 6, dronePt.y - 4); ctx.lineTo(dronePt.x + 12, dronePt.y - 4); ctx.stroke();

  }, [wirePoints, emiRadius, flightPath, humidity, voltage]);

  // Determine if the drone is being forced away by EMI rather than just flying at the target standoff
  const isEmiConstrained = emiRadius > targetStandoff;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
          <Zap className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">High-Voltage EMI Router</h1>
          <p className="text-muted-foreground">Electromagnetic interference-aware pathfinding for autonomous grid inspection.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-white">
            <div className="p-4 flex justify-center items-center overflow-x-auto relative bg-slate-50 border-b border-border">
              <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="bg-transparent rounded-md border border-slate-200 shadow-inner"
                style={{ width: '100%', maxWidth: width, height: 'auto' }}
              />
              
              {/* Legend overlay */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-slate-800"></div> Physical Wire</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500/20 rounded border border-red-500/50"></div> EMI Danger Zone</div>
                <div className="flex items-center gap-2">
                  <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3"/></svg>
                  Calculated Flight Path
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 grid grid-cols-3 gap-4">
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><UtilityPole className="w-3 h-3"/> Span Distance</span>
                   <span className="font-mono text-xl text-slate-900">120 <span className="text-sm text-slate-500">meters</span></span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-red-500"/> Calculated EMI Radius</span>
                   <span className="font-mono text-xl text-red-600">{emiRadius.toFixed(1)} <span className="text-sm text-slate-500">meters</span></span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Plane className="w-3 h-3 text-blue-500"/> Drone Standoff</span>
                   <span className={`font-mono text-xl ${isEmiConstrained ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>
                     {Math.max(emiRadius + 5, targetStandoff).toFixed(1)} <span className="text-sm text-slate-500">meters</span>
                   </span>
                 </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-yellow-500/20 shadow-sm">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20 pb-4 border-b border-yellow-100 dark:border-yellow-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Line Telemetry & Weather
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    Line Voltage
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{voltage[0]} kV</span>
                </div>
                <Slider 
                  value={voltage} 
                  onValueChange={setVoltage} 
                  min={69} max={765} step={10} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Higher voltages generate exponentially larger electromagnetic interference fields.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-muted-foreground" />
                    Relative Humidity
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{humidity[0]}%</span>
                </div>
                <Slider 
                  value={humidity} 
                  onValueChange={setHumidity} 
                  min={10} max={99} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">High moisture content increases air conductivity, expanding the arcing risk zone (Corona discharge).</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isEmiConstrained ? 'border-amber-500/50 bg-amber-50/30' : 'border-border/50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Avionics Status
                </div>
                {isEmiConstrained && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-white">
                    EMI EVASION ACTIVE
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {isEmiConstrained ? (
                  <p className="text-amber-700 dark:text-amber-500 font-medium leading-relaxed">
                    The electromagnetic field has exceeded the optimal camera standoff distance. The pathfinder has dynamically widened the flight route to protect drone avionics from catastrophic failure.
                  </p>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    The electromagnetic field is currently constrained. The drone is flying at the optimal optical zoom distance of {targetStandoff} meters to capture high-resolution imagery.
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
