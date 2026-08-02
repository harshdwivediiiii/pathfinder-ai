"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { generateLunarTerrain, calculateLunarShadows, calculateSolarPath } from "./_components/lunar-algorithm";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Box, Sphere } from "@react-three/drei";
import { Sun, Moon, Battery, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import * as THREE from "three";

function LunarMap({ grid, shadows, path, sunAngle }) {
  const size = grid.length;
  const offset = size / 2;

  // Convert A* path to 3D line coordinates
  const pathLines = useMemo(() => {
    return path.map(p => [p.x - offset + 0.5, grid[p.y][p.x].h + 0.5, p.y - offset + 0.5]);
  }, [path, grid, offset]);

  // Directional Light Position based on sun angle (orbiting the map)
  const sunRadius = 40;
  const sunElevationRad = (5 * Math.PI) / 180; 
  const sunAzimuthRad = (sunAngle * Math.PI) / 180;
  const sunX = Math.cos(sunAzimuthRad) * sunRadius;
  const sunZ = Math.sin(sunAzimuthRad) * sunRadius;
  const sunY = Math.tan(sunElevationRad) * sunRadius;

  return (
    <group>
      {/* Sun Light Source */}
      <directionalLight 
        position={[sunX, sunY, sunZ]} 
        intensity={2.0} 
        color="#ffedd5"
      />
      {/* Very dim ambient light to make shadows completely black like on the moon */}
      <ambientLight intensity={0.1} />

      {/* Visual Sun Sphere */}
      <mesh position={[sunX, sunY, sunZ]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#fcd34d" />
      </mesh>

      {/* Render Lunar Terrain Voxels */}
      {grid.map((row, y) =>
        row.map((cell, x) => {
          const isShadow = shadows[y][x];
          // We color the terrain standard moon gray. 
          // The true three.js lighting will shade it, but we also manually tint the exact tiles 
          // that our algorithm determined are in shadow to visually debug the raycaster.
          let color = "#e2e8f0"; // Bright Regolith
          if (isShadow) {
            color = "#1e293b"; // Deep permanent shadow
          }

          return (
            <Box
              key={`${x}-${y}`}
              position={[x - offset + 0.5, cell.h / 2, y - offset + 0.5]}
              args={[1, cell.h, 1]}
            >
              <meshStandardMaterial color={color} roughness={0.9} />
            </Box>
          );
        })
      )}

      {/* Render Rover Flight Path */}
      {pathLines.length > 0 && (
        <group>
          <Line
            points={pathLines}
            color="#3b82f6" // Blue path
            lineWidth={4}
            dashed={false}
          />
          {/* Start Point (Base) */}
          <mesh position={pathLines[0]}>
            <cylinderGeometry args={[0.6, 0.6, 1, 16]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          {/* End Point (Destination) */}
          <mesh position={pathLines[pathLines.length - 1]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function LunarRouterPage() {
  const [grid, setGrid] = useState([]);
  const [shadows, setShadows] = useState([]);
  const [path, setPath] = useState([]);
  const [sunAngle, setSunAngle] = useState([45]); // 0 to 360 degrees
  const [metrics, setMetrics] = useState({ distance: 0, shadowExposure: 0 });

  const size = 30;
  const startPos = { x: 2, y: 2 }; 
  const endPos = { x: 28, y: 28 }; 

  useEffect(() => {
    const newGrid = generateLunarTerrain(size);
    setGrid(newGrid);
  }, []);

  useEffect(() => {
    if (grid.length > 0) {
      // 1. Calculate Lunar Shadows based on the sun's angle
      const newShadows = calculateLunarShadows(grid, sunAngle[0]);
      setShadows(newShadows);

      // 2. Route the A* path keeping the rover in the light
      const newPath = calculateSolarPath(grid, newShadows, startPos, endPos);
      setPath(newPath);

      // 3. Telemetry
      let shadowedCount = 0;
      newPath.forEach(p => {
        if (newShadows[p.y][p.x]) shadowedCount++;
      });
      
      setMetrics({
        distance: newPath.length,
        shadowExposure: Math.floor((shadowedCount / (newPath.length || 1)) * 100)
      });
    }
  }, [grid, sunAngle]); 

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <Moon className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Artemis Mission Planning</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Lunar Base <span className="text-gradient-primary">Solar Routing.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Simulate 4D temporal-spatial illumination near the Lunar South Pole. Route solar-powered rovers along "Peaks of Eternal Light" to avoid freezing in permanent crater shadows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Orbital Ephemeris</CardTitle>
            <CardDescription>Scrub time to simulate the sun revolving around the pole.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" /> Solar Azimuth
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{sunAngle[0]}°</span>
              </div>
              <Slider 
                value={sunAngle} 
                onValueChange={setSunAngle} 
                max={360} 
                min={0} 
                step={5}
                className="py-4"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rover Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Battery className="w-3 h-3 text-emerald-500"/> Shadow Exposure Risk
                </p>
                <p className={`text-2xl font-black ${metrics.shadowExposure > 15 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {metrics.shadowExposure}%
                </p>
                {metrics.shadowExposure > 15 && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Critical Battery Drain Warning
                  </p>
                )}
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Traverse Distance</p>
                <p className="text-2xl font-black text-foreground">{metrics.distance} km</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl">
              <strong>Info:</strong> The Lunar South Pole experiences very low sun angles (simulated at 5° elevation), casting immensely long shadows. The A* algorithm dynamically walks the crater rims to stay in the light.
            </div>

          </CardContent>
        </Card>

        {/* 3D Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-amber-500" /> Crater Illumination Simulator
                </CardTitle>
                <CardDescription>Drag to rotate. Watch the path snap to illuminated crater ridges as the sun moves.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-[600px] bg-black relative">
            <Canvas camera={{ position: [0, 35, 35], fov: 45 }}>
              {grid.length > 0 && shadows.length > 0 && (
                <LunarMap 
                  grid={grid} 
                  shadows={shadows} 
                  path={path} 
                  sunAngle={sunAngle[0]} 
                />
              )}
              <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.2} />
            </Canvas>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
