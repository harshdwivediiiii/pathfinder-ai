"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { generateCavePointCloud, calculateSafePath } from "./_components/slam-algorithm";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from 'three';
import { Route, Crosshair, Map, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

// 3D Component to render the LiDAR points
function PointCloud({ points }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      pos[i * 3] = points[i].x;
      pos[i * 3 + 1] = points[i].y;
      pos[i * 3 + 2] = points[i].z;
    }
    return pos;
  }, [points]);

  return (
    <Points positions={positions}>
      <PointMaterial transparent color="#ef4444" size={0.3} sizeAttenuation={true} depthWrite={false} />
    </Points>
  );
}

// 3D Component to render the Rover's path
function RoverPath({ pathPoints, clearance }) {
  const linePoints = useMemo(() => {
    return pathPoints.map(p => [p.x, p.y, p.z]);
  }, [pathPoints]);

  return (
    <group>
      <Line
        points={linePoints}
        color="#3b82f6"
        lineWidth={3}
        dashed={false}
      />
      {/* Visualize the rover volume at the start */}
      {pathPoints.length > 0 && (
        <mesh position={[pathPoints[0].x, pathPoints[0].y, pathPoints[0].z]}>
          <sphereGeometry args={[clearance, 16, 16]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

export default function LavaTubeRouterPage() {
  const [pointCloud, setPointCloud] = useState([]);
  const [path, setPath] = useState([]);
  const [clearance, setClearance] = useState([2.5]);
  const [metrics, setMetrics] = useState({ totalDistance: 0, bottlenecks: 0 });

  const runSimulation = () => {
    // Generate new LiDAR cave
    const newCloud = generateCavePointCloud(100, 8, 3);
    setPointCloud(newCloud);
    calculateAndSetPath(newCloud, clearance[0]);
  };

  const calculateAndSetPath = (cloud, currentClearance) => {
    const newPath = calculateSafePath(cloud, 100, currentClearance);
    setPath(newPath);

    // Calculate metrics
    let dist = 0;
    let bottlenecks = 0;
    for (let i = 1; i < newPath.length; i++) {
      dist += newPath[i].distanceTo(newPath[i-1]);
      
      // Check if path was pushed far from center (meaning a tight squeeze)
      const distFromCenter = Math.sqrt(newPath[i].x**2 + newPath[i].y**2);
      if (distFromCenter > 3) bottlenecks++;
    }

    setMetrics({
      totalDistance: Math.floor(dist),
      bottlenecks: bottlenecks
    });
  };

  // Initial simulation
  useEffect(() => {
    runSimulation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate path when clearance changes
  useEffect(() => {
    if (pointCloud.length > 0) {
      calculateAndSetPath(pointCloud, clearance[0]);
    }
  }, [clearance]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <Route className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Off-World Robotics</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Lava Tube <span className="text-gradient-primary">3D Pathfinding.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Simulate autonomous SLAM routing through extraterrestrial caves. Adjust rover volumetric constraints to dodge stalagmites and maintain safe ceiling clearances.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Rover Parameters</CardTitle>
            <CardDescription>Adjust the physical constraints of the scout rover.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Clearance Radius</label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{clearance[0]}m</span>
              </div>
              <Slider 
                value={clearance} 
                onValueChange={setClearance} 
                max={4.0} 
                min={1.0} 
                step={0.1}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Larger rovers require wider berths around stalagmites, increasing path deviations.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">SLAM Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Path Distance</p>
                <p className="text-2xl font-black text-foreground">{metrics.totalDistance}m</p>
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1">Bottlenecks Avoided</p>
                <p className={`text-2xl font-black ${metrics.bottlenecks > 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {metrics.bottlenecks}
                </p>
                {metrics.bottlenecks > 5 && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Complex Nav Required
                  </p>
                )}
              </div>
            </div>

            <Button 
              onClick={runSimulation} 
              className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Scan New Cave
            </Button>
          </CardContent>
        </Card>

        {/* 3D Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crosshair className="h-5 w-5 text-rose-500" /> LiDAR Point Cloud Render
                </CardTitle>
                <CardDescription>Drag to rotate. Scroll to zoom inside the lava tube.</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span className="text-xs font-bold text-muted-foreground">Cave Wall (LiDAR)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-blue-500"></div>
                  <span className="text-xs font-bold text-muted-foreground">Rover Trajectory</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-[500px] bg-black relative">
            <Canvas camera={{ position: [0, 5, -15], fov: 60 }}>
              <ambientLight intensity={0.5} />
              
              <PointCloud points={pointCloud} />
              <RoverPath pathPoints={path} clearance={clearance[0]} />
              
              <OrbitControls target={[0, 0, 50]} />
            </Canvas>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
