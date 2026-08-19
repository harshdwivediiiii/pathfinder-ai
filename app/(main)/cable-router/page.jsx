"use client";

import { useState, useEffect } from "react";
import { generateBathymetry, calculateCableDrape } from "./_components/cable-algorithm";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { Anchor, Activity, Map, RefreshCw, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export default function CableRouterPage() {
  const [data, setData] = useState([]);
  const [stiffness, setStiffness] = useState([0.2]);
  const [metrics, setMetrics] = useState({ maxSuspension: 0, averageDepth: 0 });

  const runSimulation = () => {
    // Generate new terrain
    const rawBathymetry = generateBathymetry(150);
    // Calculate the physical drape
    const simulatedData = calculateCableDrape(rawBathymetry, stiffness[0]);
    setData(simulatedData);

    // Calculate metrics
    let maxSuspension = 0;
    let sumDepth = 0;
    simulatedData.forEach(pt => {
      const suspension = pt.cableDepth - pt.depth;
      if (suspension > maxSuspension) maxSuspension = suspension;
      sumDepth += pt.cableDepth;
    });

    setMetrics({
      maxSuspension: Math.floor(maxSuspension),
      averageDepth: Math.floor(sumDepth / simulatedData.length)
    });
  };

  // Run once on mount
  useEffect(() => {
    runSimulation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate just the drape if stiffness changes (keep same terrain)
  useEffect(() => {
    if (data.length > 0) {
      // Extract original bathymetry from current data
      const rawBathymetry = data.map(d => ({ distance: d.distance, depth: d.depth }));
      const simulatedData = calculateCableDrape(rawBathymetry, stiffness[0]);
      setData(simulatedData);
      
      // Recalculate metrics
      let maxSuspension = 0;
      simulatedData.forEach(pt => {
        const suspension = pt.cableDepth - pt.depth;
        if (suspension > maxSuspension) maxSuspension = suspension;
      });
      setMetrics(prev => ({ ...prev, maxSuspension: Math.floor(maxSuspension) }));
    }
  }, [stiffness]); // eslint-disable-line react-hooks/exhaustive-deps

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const seabed = payload[0].value;
      const cable = payload[1]?.value || seabed;
      const suspension = cable - seabed;
      
      return (
        <div className="bg-background/95 border border-border p-3 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-bold text-sm mb-2">Distance: {label} km</p>
          <div className="space-y-1 text-sm">
            <p className="text-cyan-600 font-medium">Seabed Depth: {seabed}m</p>
            <p className="text-amber-500 font-medium">Cable Depth: {cable}m</p>
            {suspension > 0 && (
              <p className="text-rose-500 font-bold mt-2">Suspension Gap: {suspension}m</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600">
          <Ship className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Telecom Infrastructure</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Deep-Sea Cable <span className="text-gradient-primary">Topographic Routing.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Simulate the physical drape of transoceanic fiber-optic cables over jagged bathymetric terrain. Minimize suspension gaps and avoid exceeding structural bend radii.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Routing Parameters</CardTitle>
            <CardDescription>Adjust the physical properties of the cable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Cable Stiffness</label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{stiffness[0]}</span>
              </div>
              <Slider 
                value={stiffness} 
                onValueChange={setStiffness} 
                max={0.5} 
                min={0.01} 
                step={0.01}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Higher stiffness prevents sharp bends but creates larger suspension gaps over canyons.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Max Suspension Gap</p>
                <p className={`text-2xl font-black ${metrics.maxSuspension > 200 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {metrics.maxSuspension}m
                </p>
                {metrics.maxSuspension > 200 && <p className="text-xs text-rose-500 mt-1">High Tension Warning</p>}
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Average Depth</p>
                <p className="text-2xl font-black text-foreground">{metrics.averageDepth}m</p>
              </div>
            </div>

            <Button 
              onClick={runSimulation} 
              className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Generate New Terrain
            </Button>
          </CardContent>
        </Card>

        {/* Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-cyan-600" /> Bathymetric Profile View
                </CardTitle>
                <CardDescription>2D Cross-section of the ocean floor and cable drape.</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-900"></div>
                  <span className="text-xs font-bold text-muted-foreground">Seabed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-amber-500"></div>
                  <span className="text-xs font-bold text-muted-foreground">Fiber Cable</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-[500px] bg-gradient-to-b from-blue-950/20 to-background relative">
            
            {/* Water Depth Indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 text-cyan-500/50 text-xs font-mono">
              <Anchor className="h-4 w-4" /> Sea Level (0m)
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 40, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="distance" hide />
                <YAxis domain={['dataMin - 500', 0]} hide />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Seabed Area */}
                <Area 
                  type="monotone" 
                  dataKey="depth" 
                  stroke="#083344" 
                  fill="#083344" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                
                {/* Cable Line */}
                <Area 
                  type="monotone" 
                  dataKey="cableDepth" 
                  stroke="#f59e0b" 
                  fill="transparent"
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
