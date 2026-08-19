"use client";

import { useState, useEffect, useMemo } from "react";
import { generateAshCloudVolumes, calculateVolumetricPath } from "./_components/volumetric-algorithm";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Box, Sphere } from "@react-three/drei";
import { Plane, CloudRain, AlertTriangle, Route } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import * as THREE from "three";

function AshRouterScene({ windSpeed, eruptionCeiling, maxAircraftCeiling }) {
  
  // Start and End Airports
  const startPos = new THREE.Vector3(-40, 15, -40); // Flight Level 150
  const endPos = new THREE.Vector3(40, 15, 40);
  
  // 1. Generate the Volumetric Ash Cloud Bounding Boxes
  const ashVolumes = useMemo(() => {
    return generateAshCloudVolumes(windSpeed, eruptionCeiling);
  }, [windSpeed, eruptionCeiling]);

  // 2. Generate the 4D Avoidance Flight Path
  const flightPath = useMemo(() => {
    return calculateVolumetricPath(startPos, endPos, ashVolumes, maxAircraftCeiling);
  }, [ashVolumes, maxAircraftCeiling]);

  return (
    <group position={[0, -20, 0]}> {/* Shift it down so it's centered in camera */}
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[100, 100, 100]} intensity={1.0} />

      {/* Terrain representation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#1e293b" wireframe={true} />
      </mesh>
      
      {/* Volcano Origin */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[5, 10, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Lava Core */}
      <mesh position={[0, 5, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Airports */}
      <group>
        <Sphere args={[2]} position={startPos}>
          <meshBasicMaterial color="#3b82f6" /> {/* Blue Start */}
        </Sphere>
        <Sphere args={[2]} position={endPos}>
          <meshBasicMaterial color="#22c55e" /> {/* Green End */}
        </Sphere>
      </group>

      {/* Drifting Ash Plume Volumes */}
      {ashVolumes.map((box, idx) => {
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        return (
          <Box key={idx} args={[size.x, size.y, size.z]} position={center}>
            <meshStandardMaterial 
              color="#52525b" // Zinc-600 (Dark gray ash)
              transparent={true} 
              opacity={0.3} 
              side={THREE.DoubleSide}
            />
            {/* Outline the penalty box for clarity */}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(size.x, size.y, size.z)]} />
              <lineBasicMaterial color="#ef4444" transparent opacity={0.5} />
            </lineSegments>
          </Box>
        );
      })}

      {/* Re-routed Flight Path */}
      {flightPath.length > 0 && (
        <Line
          points={flightPath.map(v => [v.x, v.y, v.z])}
          color="#10b981" // Emerald glowing line
          lineWidth={4}
          dashed={false}
        />
      )}
      
      {/* Aircraft Avatar (on the path) */}
      {flightPath.length > 0 && (
        <mesh position={flightPath[Math.floor(flightPath.length / 2)]}>
          <boxGeometry args={[2, 0.5, 2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}

    </group>
  );
}

export default function AshRouterPage() {
  
  // Dispersion Parameters
  const [windSpeed, setWindSpeed] = useState([2.0]);
  const [eruptionCeiling, setEruptionCeiling] = useState([30]); // FL300
  
  // Aircraft constraints
  const [maxAircraftCeiling, setMaxAircraftCeiling] = useState([40]); // FL400
  
  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">
          <Plane className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Global Air Traffic Management</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Volcanic Ash <span className="text-gradient-primary">Avoidance.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          4D volumetric pathfinder. Dynamically re-routes commercial flights over, under, or laterally around drifting silica plumes based on real-time VAAC forecasts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">VAAC Forecast Data</CardTitle>
            <CardDescription>Adjust atmospheric dispersion conditions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-blue-400" /> Jetstream Wind
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">x{windSpeed[0]}</span>
              </div>
              <Slider 
                value={windSpeed} 
                onValueChange={setWindSpeed} 
                max={5} 
                min={0} 
                step={0.5}
                className="py-4"
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                Higher winds drift the ash plume further across the airspace.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> Eruption Ceiling
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">FL{eruptionCeiling[0] * 10}</span>
              </div>
              <Slider 
                value={eruptionCeiling} 
                onValueChange={setEruptionCeiling} 
                max={50} 
                min={10} 
                step={5}
                className="py-4"
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                Altitude of the ash column. If this exceeds the Aircraft Ceiling, the pathfinder must route laterally around the cloud instead of over it.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Route className="h-4 w-4 text-emerald-500" /> Aircraft Ceiling
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">FL{maxAircraftCeiling[0] * 10}</span>
              </div>
              <Slider 
                value={maxAircraftCeiling} 
                onValueChange={setMaxAircraftCeiling} 
                max={50} 
                min={20} 
                step={5}
                className="py-4"
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border">
              <strong>Engine Logic:</strong> The 3D A* router heavily penalizes altitude changes (simulating fuel burn), but treats intersecting any ash volume box as an impassable infinite cost.
            </div>

          </CardContent>
        </Card>

        {/* 3D Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-slate-400" /> 4D Airspace Simulation
                </CardTitle>
                <CardDescription>Drag to rotate. Watch the flight path adapt as the ash bounds shift.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-[600px] bg-[#000000] relative">
            <Canvas camera={{ position: [60, 40, 80], fov: 45 }}>
              <AshRouterScene 
                windSpeed={windSpeed[0]} 
                eruptionCeiling={eruptionCeiling[0]} 
                maxAircraftCeiling={maxAircraftCeiling[0]}
              />
              <OrbitControls target={[0, 0, 0]} />
            </Canvas>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
