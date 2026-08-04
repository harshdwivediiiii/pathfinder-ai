"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateDeliveryMap, optimizeLastMileDelivery } from "./_components/delivery-algorithm";
import { Package, Truck, Navigation, Map as MapIcon, Footprints, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DeliveryRouterPage() {
  const canvasRef = useRef(null);
  
  const [simulationResult, setSimulationResult] = useState(null);
  const [numDropoffs, setNumDropoffs] = useState(3);

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 14;

  const { mapData, parkingSpots, buildingEntrances } = useMemo(() => {
    return generateDeliveryMap(WIDTH, HEIGHT, 2048); 
  }, [WIDTH, HEIGHT]);

  const dropoffs = useMemo(() => {
      // Pick random entrances
      const shuffled = [...buildingEntrances].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, numDropoffs);
  }, [buildingEntrances, numDropoffs]);

  useEffect(() => {
    const result = optimizeLastMileDelivery(mapData, parkingSpots, dropoffs);
    setSimulationResult(result);
  }, [mapData, parkingSpots, dropoffs]);

  const randomizeDropoffs = () => {
      setNumDropoffs(Math.floor(Math.random() * 4) + 2); // 2 to 5 dropoffs
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // Draw base map
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        
        if (node.isRoad) {
            ctx.fillStyle = "#334155";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (!node.isWalkable) {
            ctx.fillStyle = "#0f172a"; // Buildings
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
            ctx.fillStyle = "#1e293b"; // Courtyards
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        if (node.isParking) {
            ctx.fillStyle = "rgba(59, 130, 246, 0.4)"; // Blue tint for parking
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = "#60a5fa";
            ctx.font = "8px sans-serif";
            ctx.fillText("P", x * CELL_SIZE + 4, y * CELL_SIZE + 10);
        }
        
        if (node.isEntrance) {
            ctx.fillStyle = "#94a3b8";
            ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }
      }
    }

    // Draw active dropoffs
    dropoffs.forEach(dropoff => {
        ctx.fillStyle = "#f59e0b"; // Amber package
        ctx.beginPath();
        ctx.arc(dropoff.x * CELL_SIZE + CELL_SIZE/2, dropoff.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    if (simulationResult && simulationResult.optimalParking) {
        // Draw walking paths
        simulationResult.paths.forEach(path => {
            ctx.strokeStyle = "rgba(16, 185, 129, 0.8)"; // Emerald walking paths
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE/2, path[0].y * CELL_SIZE + CELL_SIZE/2);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE/2, path[i].y * CELL_SIZE + CELL_SIZE/2);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        });
        
        // Draw Delivery Truck at Optimal Spot
        const spot = simulationResult.optimalParking;
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#10b981";
        ctx.fillRect(spot.x * CELL_SIZE - CELL_SIZE/2, spot.y * CELL_SIZE - CELL_SIZE/2, CELL_SIZE * 2, CELL_SIZE * 2);
        
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🚚", spot.x * CELL_SIZE + CELL_SIZE/2, spot.y * CELL_SIZE + CELL_SIZE/2 + 4);
        ctx.shadowBlur = 0;
    }

  }, [mapData, dropoffs, simulationResult]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <Package className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Last-Mile Delivery Zone AI</h1>
          <p className="text-muted-foreground">Logistics optimization engine that clusters dropoffs and selects the ultimate legal parking zone.</p>
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
                className="bg-slate-950 rounded-md shadow-inner"
                style={{ width: WIDTH * CELL_SIZE, height: HEIGHT * CELL_SIZE }}
                aria-label="Interactive map showing delivery parking and walking routes"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Optimal Parking Zone</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 border border-white"></div> Package Dropoff (Entrance)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-0 border-t-2 border-dashed border-emerald-500"></div> Courier Walking Path</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-amber-500/20 shadow-sm">
            <CardHeader className="bg-amber-50 dark:bg-amber-950/20 pb-4 border-b border-amber-100 dark:border-amber-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    Delivery Cluster
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-sm font-medium">
                      <span>Packages in Cluster:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded-md">{numDropoffs}</span>
                  </div>
                  
                  <Button 
                    onClick={randomizeDropoffs}
                    variant="outline" 
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/50"
                  >
                    Simulate New Delivery Block
                  </Button>
              </div>

            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  Fleet Telemetry
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
                  Optimized
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulationResult && simulationResult.optimalParking ? (
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground flex items-center gap-1"><Navigation className="w-3 h-3"/> Target Zone</span>
                        <span className="font-mono font-medium text-emerald-600">
                            X:{simulationResult.optimalParking.x}, Y:{simulationResult.optimalParking.y}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground flex items-center gap-1"><Footprints className="w-3 h-3"/> Total Courier Walk</span>
                        <span className="font-mono font-medium text-amber-600">{simulationResult.totalWalkingDistance * 5} meters</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                        Algorithm successfully computed the centroid parking location that legally minimizes cumulative foot travel for all drops.
                    </p>
                  </div>
              ) : (
                  <div className="pt-4 text-sm text-red-500">Failed to find a legal parking spot that reaches all entrances.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
