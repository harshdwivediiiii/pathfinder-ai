"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateStationModule, calculate6DOFRoute } from "./_components/zerog-algorithm";
import { Orbit, Route, Settings2, Box, Move3D, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ZeroGRouterPage() {
  const canvasRef = useRef(null);
  
  // State
  const [obstacleDensity, setObstacleDensity] = useState([15]); // Percentage
  const [seed, setSeed] = useState(0); // Trigger regeneration
  const [viewAngle, setViewAngle] = useState(0); // For rotating the 3D projection
  
  const [routeResult, setRouteResult] = useState({ path: [], status: "Calculating...", nodesExplored: 0 });

  // Grid Configuration (Module Dimensions)
  const sizeX = 20;
  const sizeY = 15;
  const sizeZ = 12;
  const cellSize = 16; // pixels for rendering

  // Generate 3D Module Grid
  const { grid, obstacles } = useMemo(() => {
    return generateStationModule(sizeX, sizeY, sizeZ, obstacleDensity[0] / 100);
  }, [obstacleDensity, seed]);

  // Points of Interest
  const start = { x: 1, y: 1, z: 1 }; // Astrobee
  const end = { x: sizeX - 2, y: sizeY - 2, z: sizeZ - 2 }; // Target Rack

  // Recalculate 6DOF Route
  useEffect(() => {
    const result = calculate6DOFRoute(start, end, grid);
    setRouteResult(result);
  }, [grid, start, end]);

  // Render Canvas (Isometric 3D Projection)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Space Background
    ctx.fillStyle = "#020617"; // Slate 950
    ctx.fillRect(0, 0, width, height);

    // Helper function for 3D to 2D Isometric Projection
    // Rotating around the Y axis based on viewAngle
    const project = (x, y, z) => {
      // Center the grid coordinates
      const cx = x - sizeX/2;
      const cy = y - sizeY/2;
      const cz = z - sizeZ/2;
      
      // Apply rotation (simplified Y-axis rotation)
      const rad = viewAngle * (Math.PI / 180);
      const rx = cx * Math.cos(rad) - cz * Math.sin(rad);
      const rz = cx * Math.sin(rad) + cz * Math.cos(rad);
      
      // Isometric projection
      // Iso angle is ~30 degrees. 
      const isoX = (rx - rz) * Math.cos(Math.PI / 6);
      const isoY = (rx + rz) * Math.sin(Math.PI / 6) - cy; // Y is up/down in space
      
      // Scale and translate to center of canvas
      return {
        x: (isoX * cellSize) + (width / 2),
        y: (isoY * cellSize) + (height / 2)
      };
    };

    // Painter's Algorithm: Sort items by Z-depth to draw back-to-front
    const itemsToDraw = [];
    
    // 1. Add Obstacles
    obstacles.forEach(obs => {
      itemsToDraw.push({ type: 'obstacle', x: obs.x, y: obs.y, z: obs.z });
    });
    
    // 2. Add Start & End
    itemsToDraw.push({ type: 'start', ...start });
    itemsToDraw.push({ type: 'end', ...end });
    
    // 3. Add Path Nodes
    const path = routeResult.path;
    if (path) {
      path.forEach((node, index) => {
        itemsToDraw.push({ type: 'path', x: node.x, y: node.y, z: node.z, index });
      });
    }

    // Sort function based on rotated Z-depth
    itemsToDraw.sort((a, b) => {
      const rad = viewAngle * (Math.PI / 180);
      const zA = (a.x - sizeX/2) * Math.sin(rad) + (a.z - sizeZ/2) * Math.cos(rad);
      const zB = (b.x - sizeX/2) * Math.sin(rad) + (b.z - sizeZ/2) * Math.cos(rad);
      
      // We want to draw smallest Z (furthest back) first
      // But we also need to account for Y (higher Y = further back in isometric if looking down)
      // Standard isometric sort: x + y + z (unrotated). 
      // For arbitrary rotation, we sort by projected depth:
      const depthA = zA + a.y;
      const depthB = zB + b.y;
      return depthB - depthA; 
    });

    // Draw Bounding Wireframe (Module hull)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    const corners = [
      project(0,0,0), project(sizeX,0,0), project(sizeX,0,sizeZ), project(0,0,sizeZ),
      project(0,sizeY,0), project(sizeX,sizeY,0), project(sizeX,sizeY,sizeZ), project(0,sizeY,sizeZ)
    ];
    // Bottom square
    ctx.beginPath(); ctx.moveTo(corners[0].x, corners[0].y); ctx.lineTo(corners[1].x, corners[1].y); ctx.lineTo(corners[2].x, corners[2].y); ctx.lineTo(corners[3].x, corners[3].y); ctx.closePath(); ctx.stroke();
    // Top square
    ctx.beginPath(); ctx.moveTo(corners[4].x, corners[4].y); ctx.lineTo(corners[5].x, corners[5].y); ctx.lineTo(corners[6].x, corners[6].y); ctx.lineTo(corners[7].x, corners[7].y); ctx.closePath(); ctx.stroke();
    // Pillars
    for(let i=0; i<4; i++) { ctx.beginPath(); ctx.moveTo(corners[i].x, corners[i].y); ctx.lineTo(corners[i+4].x, corners[i+4].y); ctx.stroke(); }


    // Draw Items
    itemsToDraw.forEach(item => {
      const pt = project(item.x, item.y, item.z);
      
      if (item.type === 'obstacle') {
        // Draw isometric cube for obstacle
        ctx.fillStyle = "rgba(100, 116, 139, 0.6)"; // Slate 500
        ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
        ctx.lineWidth = 1;
        
        // Simplified cube drawing (just a diamond for top and filled rect for sides)
        const size = cellSize * 0.8;
        ctx.fillRect(pt.x - size/2, pt.y - size/2, size, size);
        ctx.strokeRect(pt.x - size/2, pt.y - size/2, size, size);
      }
      
      else if (item.type === 'start') {
        ctx.fillStyle = "#3b82f6"; // Blue Astrobee
        ctx.beginPath(); ctx.arc(pt.x, pt.y, cellSize * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
      }
      
      else if (item.type === 'end') {
        ctx.fillStyle = "#10b981"; // Emerald Target
        ctx.beginPath(); ctx.arc(pt.x, pt.y, cellSize * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
      }
      
      else if (item.type === 'path') {
        ctx.fillStyle = "#f59e0b"; // Amber path node
        ctx.beginPath(); ctx.arc(pt.x, pt.y, cellSize * 0.25, 0, Math.PI * 2); ctx.fill();
        
        // Draw line to previous node
        if (item.index > 0) {
          const prevItem = path[item.index - 1];
          const prevPt = project(prevItem.x, prevItem.y, prevItem.z);
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(prevPt.x, prevPt.y);
          ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    });

  }, [grid, routeResult, viewAngle]);

  const isSafe = routeResult.path.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Move3D className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zero-Gravity 6DOF Router</h1>
          <p className="text-muted-foreground">Volumetric A* pathfinding for autonomous microgravity robots.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
            <CardHeader className="bg-slate-900 border-b border-slate-800 pb-4">
              <CardTitle className="text-base text-slate-200 flex items-center justify-between">
                <span>3D Module Simulation (Isometric)</span>
                <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">
                  {sizeX}x{sizeY}x{sizeZ} Volume
                </Badge>
              </CardTitle>
            </CardHeader>
            <div className="p-0 flex justify-center items-center relative" style={{ height: '500px' }}>
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={500} 
                className="bg-transparent absolute inset-0 w-full h-full"
              />
              
              {/* Overlay controls for rotation */}
              <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur p-3 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-300 font-medium">Camera Angle</span>
                </div>
                <Slider 
                  value={[viewAngle]} 
                  onValueChange={(val) => setViewAngle(val[0])} 
                  min={0} max={360} step={5} 
                  className="w-32"
                />
              </div>
            </div>
            
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-violet-500/20 shadow-sm">
            <CardHeader className="bg-violet-50 dark:bg-violet-950/20 pb-4 border-b border-violet-100 dark:border-violet-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-violet-500" />
                Environment Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Box className="w-4 h-4 text-muted-foreground" />
                    Obstacle Density
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{obstacleDensity[0]}%</span>
                </div>
                <Slider 
                  value={obstacleDensity} 
                  onValueChange={setObstacleDensity} 
                  min={0} max={40} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Represents floating equipment, loose cables, and working astronauts.</p>
              </div>

              <Button 
                onClick={() => setSeed(s => s + 1)} 
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                Generate New Module Layout
              </Button>

            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isSafe ? 'border-violet-500/30' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Orbit className={`w-4 h-4 ${isSafe ? 'text-violet-500' : 'text-red-500'}`} />
                  Pathfinder Status
                </div>
                <Badge variant={isSafe ? "outline" : "destructive"} className={isSafe ? "text-violet-600 border-violet-200" : ""}>
                  {isSafe ? "TRAJECTORY LOCKED" : "TRAPPED"}
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
                    <span className="text-muted-foreground">3D Waypoints</span>
                    <span className="font-mono font-medium">{routeResult.path.length}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground">Search Space Explored</span>
                    <span className="font-mono font-medium">{routeResult.nodesExplored.toLocaleString()} nodes</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
