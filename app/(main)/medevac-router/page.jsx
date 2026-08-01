"use client";

import { useState, useEffect, useMemo } from "react";
import { generateTerrain, calculateViewshed, calculateStealthPath } from "./_components/terrain-algorithm";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Box } from "@react-three/drei";
import { Crosshair, ShieldAlert, Mountain, RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

function TerrainMap({ grid, viewshed, path, radarPos, flightAltitude }) {
  const size = grid.length;
  const offset = size / 2;

  // Convert A* path to 3D line coordinates
  // Add flightAltitude to the terrain height at each point
  const pathLines = useMemo(() => {
    return path.map(p => [p.x - offset + 0.5, grid[p.y][p.x].h + flightAltitude, p.y - offset + 0.5]);
  }, [path, grid, offset, flightAltitude]);

  return (
    <group>
      {/* Render Terrain Voxels */}
      {grid.map((row, y) =>
        row.map((cell, x) => {
          const isExposed = viewshed[y][x];
          // Determine voxel color based on exposure and height
          let color = "#4ade80"; // Base green
          if (isExposed) color = "#f87171"; // Red threat zone
          else if (cell.h > 8) color = "#9ca3af"; // Gray mountain peaks
          
          return (
            <Box
              key={`${x}-${y}`}
              position={[x - offset + 0.5, cell.h / 2, y - offset + 0.5]}
              args={[1, cell.h, 1]}
            >
              <meshStandardMaterial color={color} opacity={0.9} transparent />
            </Box>
          );
        })
      )}

      {/* Render Medevac Flight Path */}
      {pathLines.length > 0 && (
        <group>
          <Line
            points={pathLines}
            color="#3b82f6"
            lineWidth={4}
            dashed={false}
          />
          {/* Helicopter Start Marker */}
          <mesh position={pathLines[0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          {/* LZ End Marker */}
          <mesh position={pathLines[pathLines.length - 1]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}

      {/* Render Enemy Radar */}
      <mesh position={[radarPos.x - offset + 0.5, grid[radarPos.y][radarPos.x].h + 1.5, radarPos.y - offset + 0.5]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#dc2626" wireframe />
      </mesh>
    </group>
  );
}

export default function MedevacRouterPage() {
  const [grid, setGrid] = useState([]);
  const [viewshed, setViewshed] = useState([]);
  const [path, setPath] = useState([]);
  const [altitude, setAltitude] = useState([1.5]); // AGL (Above Ground Level)
  const [metrics, setMetrics] = useState({ distance: 0, exposureRisk: 0 });

  const size = 30;
  const radarPos = { x: 15, y: 15 };
  const startPos = { x: 2, y: 2 }; // Safe Base
  const endPos = { x: 28, y: 12 }; // Extraction Zone (behind enemy lines)

  const runSimulation = () => {
    const newGrid = generateTerrain(size);
    setGrid(newGrid);
    updatePathing(newGrid, altitude[0]);
  };

  const updatePathing = (currentGrid, currentAltitude) => {
    // 1. Calculate the Radar Threat Viewshed based on the helicopter's altitude
    const newViewshed = calculateViewshed(currentGrid, radarPos, currentAltitude);
    setViewshed(newViewshed);

    // 2. Route the A* path avoiding the threat zones
    const newPath = calculateStealthPath(currentGrid, newViewshed, startPos, endPos);
    setPath(newPath);

    // 3. Telemetry
    let exposedCount = 0;
    newPath.forEach(p => {
      if (newViewshed[p.y][p.x]) exposedCount++;
    });
    
    setMetrics({
      distance: newPath.length,
      exposureRisk: Math.floor((exposedCount / newPath.length) * 100) || 0
    });
  };

  useEffect(() => {
    runSimulation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (grid.length > 0) {
      updatePathing(grid, altitude[0]);
    }
  }, [altitude]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Tactical Aerospace</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Threat-Aware <span className="text-gradient-primary">Medevac Routing.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Utilize 3D terrain-masking to plot Nap-of-the-Earth flight paths. Avoid enemy anti-air radar line-of-sight while securing casualty extraction zones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Flight Parameters</CardTitle>
            <CardDescription>Adjust Altitude Above Ground Level (AGL).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Flight Altitude</label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{altitude[0]}m AGL</span>
              </div>
              <Slider 
                value={altitude} 
                onValueChange={setAltitude} 
                max={15.0} 
                min={0.5} 
                step={0.5}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Higher altitudes provide shorter, straighter paths but drastically increase radar visibility and SAM threat.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tactical Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Radar Exposure Risk</p>
                <p className={`text-2xl font-black ${metrics.exposureRisk > 10 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {metrics.exposureRisk}%
                </p>
                {metrics.exposureRisk > 10 && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> SAM Intercept Probable
                  </p>
                )}
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Fuel Cost (Distance)</p>
                <p className="text-2xl font-black text-foreground">{metrics.distance} km</p>
              </div>
            </div>

            <Button 
              onClick={runSimulation} 
              className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Generate New Topography
            </Button>
          </CardContent>
        </Card>

        {/* 3D Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="h-5 w-5 text-rose-500" /> Topographic Viewshed Render
                </CardTitle>
                <CardDescription>Drag to rotate. Red voxels indicate direct LOS to enemy radar.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-[600px] bg-slate-950 relative">
            <Canvas camera={{ position: [0, 25, 25], fov: 50 }}>
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 20, 10]} intensity={1.5} />
              
              {grid.length > 0 && (
                <TerrainMap 
                  grid={grid} 
                  viewshed={viewshed} 
                  path={path} 
                  radarPos={radarPos} 
                  flightAltitude={altitude[0]} 
                />
              )}
              
              <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.1} />
            </Canvas>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
