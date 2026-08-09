"use client";

import React, { useState } from "react";
import { mockPathwayGraph, calculateSpatialCoordinates } from "./_components/webxr-algorithm";
import { Glasses, Box, Compass, Cuboid, LocateFixed, Eye, Move3D } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ArVrPathwayPage() {
  const [isRendering, setIsRendering] = useState(false);
  const [spatialNodes, setSpatialNodes] = useState(null);

  const handleRender = () => {
      setIsRendering(true);
      setSpatialNodes(null);
      
      // Simulate WebXR engine initializing and generating scene graph
      setTimeout(() => {
          const coords = calculateSpatialCoordinates(mockPathwayGraph);
          setSpatialNodes(coords);
          setIsRendering(false);
      }, 1800);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Glasses className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AR/VR Immersive Pathway</h1>
          <p className="text-muted-foreground">Experimental WebXR integration transforming static 2D flowcharts into navigable 3D spatial environments.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Data & Controls */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Box className="w-5 h-5 text-violet-500" />
                 2D Logical Graph
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6 flex flex-col">
              
              <div className="space-y-2 flex-grow overflow-y-auto max-h-[300px] pr-2">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Raw Pathway Nodes</h4>
                  {mockPathwayGraph.map((node) => (
                      <div key={node.id} className="p-2 border rounded bg-slate-50 dark:bg-slate-900/30 text-sm flex justify-between items-center">
                          <span className="font-medium">{node.label}</span>
                          <Badge variant="outline" className="text-xs">{node.type}</Badge>
                      </div>
                  ))}
              </div>
              
              <div className="pt-4 border-t">
                  <Button 
                      onClick={handleRender} 
                      disabled={isRendering}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12"
                  >
                      {isRendering ? (
                          <>
                              <Eye className="w-4 h-4 mr-2 animate-pulse" /> Initializing WebXR Scene...
                          </>
                      ) : (
                          <>
                              <Move3D className="w-4 h-4 mr-2" /> Calculate 3D Spatial Coordinates
                          </>
                      )}
                  </Button>
              </div>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: 3D Visualization Data */}
        <div className="lg:col-span-2 space-y-6">
          
          {!spatialNodes && !isRendering && (
              <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
                  <Cuboid className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                  <p>WebXR Engine Offline.</p>
                  <p className="text-sm">Click the render button to map the 2D graph into 3D spatial coordinates.</p>
              </div>
          )}
          
          {isRendering && (
              <div className="h-full border rounded-xl flex flex-col items-center justify-center p-12 text-center bg-card">
                  <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 border-4 border-violet-200 dark:border-violet-900 rounded-xl transform rotate-45"></div>
                      <div className="absolute inset-0 border-4 border-violet-500 rounded-xl animate-spin" style={{ animationDuration: '4s' }}></div>
                      <Compass className="absolute inset-0 m-auto w-8 h-8 text-violet-500 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Calculating Geometry</h3>
                  <p className="text-sm text-muted-foreground animate-pulse">Mapping logical nodes to Cartesian space (x, y, z)...</p>
              </div>
          )}
          
          {spatialNodes && !isRendering && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <Card className="border-violet-500/20 shadow-sm overflow-hidden">
                    <div className="bg-violet-500 h-1 w-full"></div>
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-lg flex justify-between items-center">
                            Calculated Spatial Scene Graph
                            <Badge className="bg-violet-100 text-violet-800 border-violet-200">
                                {spatialNodes.length} Volumes Generated
                            </Badge>
                        </CardTitle>
                        <CardDescription>Ready for injection into Three.js / Babylon.js canvas.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                            {spatialNodes.map((node) => (
                                <div key={node.id} className="p-4 rounded-xl border bg-card hover:border-violet-400 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-md">{node.label}</h4>
                                        <LocateFixed className="w-4 h-4 text-slate-400" />
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 font-mono text-sm text-center">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded flex flex-col items-center">
                                            <span className="text-xs text-slate-500 mb-1">X (Lateral)</span>
                                            <span className={node.coordinates.x !== 0 ? 'text-violet-600 font-bold' : ''}>
                                                {node.coordinates.x.toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded flex flex-col items-center">
                                            <span className="text-xs text-slate-500 mb-1">Y (Height)</span>
                                            <span className={node.coordinates.y !== 0 ? 'text-violet-600 font-bold' : ''}>
                                                {node.coordinates.y.toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded flex flex-col items-center">
                                            <span className="text-xs text-slate-500 mb-1">Z (Depth)</span>
                                            <span className="text-emerald-600 font-bold">
                                                {node.coordinates.z.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 text-xs text-muted-foreground flex justify-between">
                                        <span>Type: {node.type}</span>
                                        <span>HitBox Vol: {node.hitBoxVolume}m³</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                    </CardContent>
                </Card>
                
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
