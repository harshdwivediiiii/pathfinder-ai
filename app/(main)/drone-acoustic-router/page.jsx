"use client";

import { useState, useEffect, useMemo } from "react";
import { generateCityGrid, calculateAcousticPath } from "./_components/acoustic-algorithm";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Box, Text } from "@react-three/drei";
import { Navigation, Moon, Sun, Plane, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ZONE_COLORS = {
  0: "#3b82f6", // Residential (Blue)
  1: "#a855f7", // Commercial (Purple)
  2: "#f59e0b", // Industrial (Yellow)
  3: "#3f3f46", // Highway (Dark Gray)
};

const ZONE_HEIGHTS = {
  0: 0.5, // Residential (Low)
  1: 1.5, // Commercial (Medium)
  2: 1.0, // Industrial (Medium)
  3: 0.1, // Highway (Flat)
};

function CityMap({ grid, path }) {
  const gridSize = grid.length;
  const offset = gridSize / 2;

  // Convert A* path to 3D line coordinates
  const pathLines = useMemo(() => {
    return path.map(p => [p.x - offset + 0.5, 3, p.y - offset + 0.5]);
  }, [path, offset]);

  return (
    <group>
      {/* Render City Blocks */}
      {grid.map((row, y) =>
        row.map((cell, x) => (
          <Box
            key={`${x}-${y}`}
            position={[x - offset + 0.5, ZONE_HEIGHTS[cell.type] / 2, y - offset + 0.5]}
            args={[0.9, ZONE_HEIGHTS[cell.type], 0.9]}
          >
            <meshStandardMaterial color={ZONE_COLORS[cell.type]} />
          </Box>
        ))
      )}

      {/* Render Drone Path */}
      {pathLines.length > 0 && (
        <group>
          <Line
            points={pathLines}
            color="#ef4444"
            lineWidth={5}
            dashed={false}
          />
          {/* Drone marker at end */}
          <mesh position={pathLines[pathLines.length - 1]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          {/* Warehouse marker at start */}
          <mesh position={pathLines[0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function DroneAcousticRouterPage() {
  const [grid, setGrid] = useState([]);
  const [path, setPath] = useState([]);
  const [isNight, setIsNight] = useState(false);
  const [metrics, setMetrics] = useState({ distance: 0, residentialTiles: 0 });

  // Start at Warehouse (Industrial), Deliver to deep Residential
  const startPos = { x: 1, y: 1 };
  const endPos = { x: 18, y: 18 };

  useEffect(() => {
    const newGrid = generateCityGrid(20, 20);
    setGrid(newGrid);
  }, []);

  useEffect(() => {
    if (grid.length > 0) {
      const newPath = calculateAcousticPath(grid, startPos, endPos, isNight);
      setPath(newPath);

      // Calculate Telemetry
      let resTiles = 0;
      newPath.forEach(p => {
        if (grid[p.y][p.x].type === 0) resTiles++;
      });
      setMetrics({
        distance: newPath.length,
        residentialTiles: resTiles
      });
    }
  }, [grid, isNight]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600">
          <Plane className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Urban Logistics</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Acoustic Footprint <span className="text-gradient-primary">Routing.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Dynamically alter last-mile drone delivery flights to avoid noise pollution in residential neighborhoods during nocturnal hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Zoning & Regulations</CardTitle>
            <CardDescription>Adjust municipal time constraints to observe routing changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div className="space-y-0.5">
                <Label className="text-base font-bold flex items-center gap-2">
                  {isNight ? <Moon className="h-4 w-4 text-violet-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                  {isNight ? "Night Time" : "Day Time"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isNight ? "Strict noise ordinances active." : "Standard ambient noise."}
                </p>
              </div>
              <Switch checked={isNight} onCheckedChange={setIsNight} />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Flight Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Blocks Traveled</p>
                <p className="text-2xl font-black text-foreground">{metrics.distance}</p>
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Residential Infractions</p>
                <p className={`text-2xl font-black ${metrics.residentialTiles > 5 && isNight ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {metrics.residentialTiles}
                </p>
                {metrics.residentialTiles > 5 && isNight && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Noise Ordinance Violation Risk
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border text-xs text-muted-foreground">
              <p className="font-bold text-foreground mb-2">Map Legend</p>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Residential (Avoid at Night)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div> Commercial</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div> Industrial (Safe)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-zinc-700 rounded-sm"></div> Highway (Ideal)</div>
            </div>

          </CardContent>
        </Card>

        {/* 3D Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-violet-500" /> Drone Delivery Vector
                </CardTitle>
                <CardDescription>3D simulated flight path over municipal zoning grids.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-[600px] bg-slate-950 relative">
            <Canvas camera={{ position: [0, 20, 20], fov: 50 }}>
              <ambientLight intensity={isNight ? 0.2 : 0.8} />
              <directionalLight position={[10, 20, 10]} intensity={isNight ? 0.3 : 1.5} />
              
              {grid.length > 0 && <CityMap grid={grid} path={path} />}
              
              <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.2} />
            </Canvas>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
