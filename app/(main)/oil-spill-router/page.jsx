"use client";

import { useState, useEffect, useRef } from "react";
import { OilSpillSimulation, GRID_SIZE } from "./_components/dispersion-algorithm";
import { Droplet, Wind, Navigation2, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export default function OilSpillRouterPage() {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const animationRef = useRef(null);
  
  const [windDirection, setWindDirection] = useState([90]); // Degrees (0 is North)
  const [windSpeed, setWindSpeed] = useState([5]); // Force multiplier
  const [metrics, setMetrics] = useState({ area: 0, timeElapsed: 0 });

  // Initialize simulation
  useEffect(() => {
    simRef.current = new OilSpillSimulation();
    
    // Animation loop
    let lastTime = 0;
    let ticks = 0;

    const render = (time) => {
      // Throttle updates slightly so it's visible to the human eye
      if (time - lastTime > 50) {
        if (simRef.current) {
          // Advance simulation
          simRef.current.step(windDirection[0], windSpeed[0]);
          ticks++;

          // Update metrics occasionally
          if (ticks % 10 === 0) {
            setMetrics({
              area: simRef.current.spillArea,
              timeElapsed: Math.floor(ticks / 10)
            });
          }

          drawCanvas();
        }
        lastTime = time;
      }
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationRef.current);
  }, [windDirection, windSpeed]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !simRef.current) return;
    
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    
    const cellW = width / GRID_SIZE;
    const cellH = height / GRID_SIZE;

    // Clear background (Ocean Water)
    ctx.fillStyle = "#0f172a"; 
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines faintly
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for(let i=0; i<=GRID_SIZE; i+=5) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(width, i * cellH);
      ctx.stroke();
    }

    const grid = simRef.current.getGrid();
    
    // Draw Oil Dispersion
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const val = grid[y][x];
        if (val > 0.1) {
          // Calculate opacity based on density (val)
          const alpha = Math.min(1.0, val / 10);
          ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`; // Amber color for toxic oil
          ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
        }
      }
    }

    const asvs = simRef.current.getASVs();
    
    // Draw ASV Target Waypoints (Perimeter)
    ctx.strokeStyle = "#10b981"; // Emerald
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < asvs.length; i++) {
      const targetX = asvs[i].targetX * cellW;
      const targetY = asvs[i].targetY * cellH;
      if (i === 0) ctx.moveTo(targetX, targetY);
      else ctx.lineTo(targetX, targetY);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw ASVs
    for (const asv of asvs) {
      const px = asv.x * cellW;
      const py = asv.y * cellH;
      
      // Draw ASV dot
      ctx.fillStyle = "#3b82f6"; // Blue
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw vector line to target
      if (asv.targetX && asv.targetY) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(asv.targetX * cellW, asv.targetY * cellH);
        ctx.stroke();
      }
    }
  };

  const resetSim = () => {
    simRef.current = new OilSpillSimulation();
    setMetrics({ area: 0, timeElapsed: 0 });
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
          <Droplet className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Disaster Response</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Oil Spill Swarm <span className="text-gradient-primary">Routing.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Dynamic fluid-dispersion modeling. Route a swarm of Autonomous Surface Vessels (ASVs) to drop containment booms ahead of the slick's leading edge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Ocean Currents</CardTitle>
            <CardDescription>Adjust variables to alter the dispersion physics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Navigation2 className="h-4 w-4 text-blue-500" /> Current Direction
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{windDirection[0]}°</span>
              </div>
              <Slider 
                value={windDirection} 
                onValueChange={setWindDirection} 
                max={360} 
                min={0} 
                step={5}
                className="py-4"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Wind className="h-4 w-4 text-blue-500" /> Current Velocity
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{windSpeed[0]} knots</span>
              </div>
              <Slider 
                value={windSpeed} 
                onValueChange={setWindSpeed} 
                max={15} 
                min={0} 
                step={1}
                className="py-4"
              />
            </div>

            <Button onClick={resetSim} variant="outline" className="w-full">
              Reset Simulation
            </Button>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Live Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-amber-500"/> Contaminated Area
                </p>
                <p className="text-2xl font-black text-amber-500">
                  {metrics.area} <span className="text-sm font-normal text-muted-foreground">sq km</span>
                </p>
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Ship className="w-3 h-3 text-blue-500"/> Swarm Status
                </p>
                <p className="text-lg font-bold text-foreground">Intercepting Edge</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 2D HTML5 Canvas Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-amber-500" /> Dispersion & Intercept Canvas
                </CardTitle>
                <CardDescription>Cellular automata modeling. Watch the blue ASVs predict and surround the amber oil spread.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-6 min-h-[600px] flex items-center justify-center bg-[#0a0f1a]">
            <div className="relative border border-border rounded-lg overflow-hidden shadow-2xl">
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={600} 
                className="w-full max-w-[600px] aspect-square bg-[#0f172a]"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
