"use client";

import { useState, useEffect, useMemo } from "react";
import { generateBladeGeometry, calculateHelicalPath } from "./_components/helical-algorithm";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { Wind, ScanLine, Camera, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import * as THREE from "three";

function TurbineBlade({ bladePoints, standoff, density }) {
  
  // 1. Construct the Blade Mesh geometry from the raw points
  const bladeGeometry = useMemo(() => {
    // Flatten the array of rings into a single vertex array
    const vertices = [];
    const faces = [];
    
    // Total rings
    const rings = bladePoints.length;
    const ptsPerRing = bladePoints[0].length;
    
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < ptsPerRing; j++) {
        const pt = bladePoints[i][j];
        vertices.push(pt.x, pt.y, pt.z);
      }
    }
    
    // Connect the rings to form quad faces (split into two triangles)
    for (let i = 0; i < rings - 1; i++) {
      for (let j = 0; j < ptsPerRing - 1; j++) {
        const current = i * ptsPerRing + j;
        const next = current + 1;
        const top = current + ptsPerRing;
        const topNext = next + ptsPerRing;
        
        // Triangle 1
        faces.push(current, next, top);
        // Triangle 2
        faces.push(next, topNext, top);
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(faces);
    geo.computeVertexNormals();
    return geo;
  }, [bladePoints]);

  // 2. Generate the Helical Flight Path
  const flightPath = useMemo(() => {
    return calculateHelicalPath(bladePoints, standoff, density);
  }, [bladePoints, standoff, density]);

  return (
    <group position={[0, -20, 0]}> {/* Shift it down so it's centered in camera */}
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, 5, -10]} intensity={0.5} color="#93c5fd" />

      {/* Turbine Blade Mesh */}
      <mesh geometry={bladeGeometry}>
        <meshStandardMaterial 
          color="#f8fafc" 
          roughness={0.2}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Drone Helical Flight Path */}
      {flightPath.length > 0 && (
        <Line
          points={flightPath}
          color="#10b981" // Emerald glowing line
          lineWidth={3}
          dashed={false}
        />
      )}
      
      {/* Drone Avatar (at the end of the path for visualization) */}
      {flightPath.length > 0 && (
        <mesh position={flightPath[flightPath.length - 1]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

    </group>
  );
}

export default function TurbineRouterPage() {
  const [bladeData, setBladeData] = useState(null);
  
  // Drone Path Parameters
  const [standoff, setStandoff] = useState([3.0]); // Meters from surface
  const [density, setDensity] = useState([12]); // Number of helical loops
  
  const [metrics, setMetrics] = useState({ pathLength: 0, scanCoverage: 0 });

  useEffect(() => {
    // Generate the procedural blade model once on mount
    const data = generateBladeGeometry();
    setBladeData(data);
  }, []);

  useEffect(() => {
    if (bladeData) {
      // Very rough telemetry calculation
      const length = (bladeData.bladeLength * density[0] * 1.5).toFixed(0);
      const coverage = Math.min(100, Math.max(10, density[0] * 7)).toFixed(0);
      
      setMetrics({
        pathLength: length,
        scanCoverage: coverage
      });
    }
  }, [bladeData, density]);

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <Wind className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Renewable Energy Infrastructure</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Turbine Drone <span className="text-gradient-primary">Routing.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate 3D helical structural-tracing sweep patterns. Contours mathematically to the aerodynamic twist of offshore turbine blades to maintain a constant focal distance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Inspection Parameters</CardTitle>
            <CardDescription>Adjust routing to match camera specs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-emerald-500" /> Focal Standoff
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{standoff[0]} m</span>
              </div>
              <Slider 
                value={standoff} 
                onValueChange={setStandoff} 
                max={10} 
                min={1} 
                step={0.5}
                className="py-4"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-emerald-500" /> Sweep Density
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{density[0]} loops</span>
              </div>
              <Slider 
                value={density} 
                onValueChange={setDensity} 
                max={30} 
                min={2} 
                step={1}
                className="py-4"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Flight Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-emerald-500"/> Surface Coverage
                </p>
                <p className={`text-2xl font-black ${metrics.scanCoverage < 100 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {metrics.scanCoverage}%
                </p>
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Path Length</p>
                <p className="text-2xl font-black text-foreground">{metrics.pathLength} m</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl">
              <strong>Info:</strong> Standard drone routers fail because turbine blades twist up to 60 degrees. This parametric router calculates the surface normal vector at every point to push the flight path outward dynamically.
            </div>

          </CardContent>
        </Card>

        {/* 3D Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-emerald-500" /> Structural-Tracing Simulator
                </CardTitle>
                <CardDescription>Drag to rotate in 3D. Notice how the green helix perfectly hugs the twisted geometry.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-[600px] bg-[#0f172a] relative">
            <Canvas camera={{ position: [20, 0, 40], fov: 45 }}>
              {bladeData && (
                <TurbineBlade 
                  bladePoints={bladeData.points} 
                  standoff={standoff[0]} 
                  density={density[0]} 
                />
              )}
              <OrbitControls target={[0, 0, 0]} />
            </Canvas>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
