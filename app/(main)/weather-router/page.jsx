"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateWeatherMap, calculateWeatherRoute } from "./_components/weather-algorithm";
import { CloudRain, Navigation, Map as MapIcon, CloudFog, CloudLightning, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function WeatherRouterPage() {
  const canvasRef = useRef(null);
  
  const [weatherSeverity, setWeatherSeverity] = useState([5]); 
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating..." });

  const WIDTH = 60;
  const HEIGHT = 40;
  const CELL_SIZE = 12;

  const START = { x: 5, y: HEIGHT - 10 }; 
  const END = { x: WIDTH - 5, y: 5 }; 

  const mapData = useMemo(() => {
    return generateWeatherMap(WIDTH, HEIGHT, 1024); 
  }, [WIDTH, HEIGHT]);

  useEffect(() => {
    const result = calculateWeatherRoute(START, END, mapData, weatherSeverity[0]);
    setRouteResult(result);
  }, [mapData, weatherSeverity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        const normalizedElev = node.elevation / 1000;
        
        let r, g, b;
        if (node.material === 'dirt') {
            r = 139 + normalizedElev * 50;
            g = 69 + normalizedElev * 30;
            b = 19 + normalizedElev * 10;
        } else {
            r = 150 + normalizedElev * 50;
            g = 150 + normalizedElev * 50;
            b = 150 + normalizedElev * 50;
        }
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
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

    // Rain overlay effect
    if (weatherSeverity[0] > 0) {
        ctx.fillStyle = `rgba(50, 50, 200, ${weatherSeverity[0] * 0.05})`;
        ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);
    }

    ctx.fillStyle = "#ef4444"; 
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
      ctx.strokeStyle = "#3b82f6"; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      ctx.stroke();
    }

  }, [mapData, weatherSeverity, routeResult]);

  const isSafe = routeResult.path && routeResult.path.length > 0;
  const dirtNodes = routeResult.path?.filter(p => mapData[p.y][p.x].material === 'dirt')?.length || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <CloudLightning className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weather-Aware Trajectory Planner</h1>
          <p className="text-muted-foreground">Adjust routes dynamically based on severe weather, road material, and elevation changes.</p>
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
                aria-label="Interactive map showing weather-aware routes, dirt vs paved roads, and endpoints"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div> Origin</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></div> Destination</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#8b4513]"></div> Dirt Road</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#969696]"></div> Paved Road</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500"></div> Optimal Route</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-blue-500/20 shadow-sm">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/20 pb-4 border-b border-blue-100 dark:border-blue-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-500" />
                Meteorological Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CloudFog className="w-4 h-4 text-muted-foreground" />
                    Weather Severity
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">Level {weatherSeverity[0]}</span>
                </div>
                <Slider 
                  value={weatherSeverity} 
                  onValueChange={setWeatherSeverity} 
                  min={0} max={10} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Adjust the severity of the weather (e.g., rain, snow). High severity applies heavy penalties to steep dirt roads.</p>
              </div>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-emerald-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isSafe ? 'text-emerald-500' : 'text-red-500'}`} />
                  Route Status
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-emerald-600 border-emerald-200" : ""}>
                  {isSafe ? "Route Active" : "UNSAFE"}
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
                    <span className="text-muted-foreground flex items-center gap-1"><MapIcon className="w-3 h-3"/> Distance</span>
                    <span className="font-mono font-medium">{(routeResult.path.length - 1) * 5} km</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><CloudRain className="w-3 h-3"/> Dirt Segments Used</span>
                    <span className="font-mono font-medium text-amber-600">{dirtNodes}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    The pathfinder recalculates in real-time, choosing paved roads over dirt trails when precipitation levels increase.
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
