"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateSemanticMap, generateNavInstructions } from "./_components/nlp-algorithm";
import { Mic, MapPin, Navigation, Bot, Volume2, ShieldCheck, Map as MapIcon, CornerUpRight, MapPinOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function VoiceAssistantPage() {
  const canvasRef = useRef(null);
  
  const [useContextualLLM, setUseContextualLLM] = useState(true); 
  const [instructions, setInstructions] = useState([]);
  const [activeInstructionIdx, setActiveInstructionIdx] = useState(0);

  const WIDTH = 40;
  const HEIGHT = 40;
  const CELL_SIZE = 14;

  const mapData = useMemo(() => {
    return generateSemanticMap(WIDTH, HEIGHT, 1024); 
  }, [WIDTH, HEIGHT]);

  // A hardcoded zig-zag path hitting intersections
  const path = useMemo(() => {
     return [
         {x: 2, y: 2},
         {x: 10, y: 2},
         {x: 10, y: 15},
         {x: 25, y: 15},
         {x: 25, y: 30},
         {x: 35, y: 30}
     ];
  }, []);
  
  // Expand path into all nodes for drawing the line
  const fullPath = useMemo(() => {
     const full = [];
     for(let i=0; i<path.length-1; i++){
         const p1 = path[i];
         const p2 = path[i+1];
         if(p1.x === p2.x) {
             const step = Math.sign(p2.y - p1.y);
             for(let y=p1.y; y !== p2.y; y+=step) full.push({x: p1.x, y});
         } else {
             const step = Math.sign(p2.x - p1.x);
             for(let x=p1.x; x !== p2.x; x+=step) full.push({x, y: p1.y});
         }
     }
     full.push(path[path.length-1]);
     return full;
  }, [path]);

  useEffect(() => {
    const inst = generateNavInstructions(fullPath, mapData, useContextualLLM);
    setInstructions(inst);
    setActiveInstructionIdx(0);
  }, [fullPath, mapData, useContextualLLM]);

  // Simulate driving along the route
  useEffect(() => {
      const interval = setInterval(() => {
          setActiveInstructionIdx(idx => {
              if (idx < instructions.length - 1) return idx + 1;
              return 0; // loop
          });
      }, 4000); // Trigger next instruction every 4 seconds
      return () => clearInterval(interval);
  }, [instructions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    // Draw base map
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw Landmarks
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const node = mapData[y][x];
        if (node.landmark) {
            ctx.fillStyle = "rgba(234, 179, 8, 0.4)"; // Yellow subtle background
            ctx.fillRect(x * CELL_SIZE - CELL_SIZE, y * CELL_SIZE - CELL_SIZE, CELL_SIZE * 3, CELL_SIZE * 3);
            
            // Center pip
            ctx.fillStyle = "#eab308";
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
      }
    }

    // Draw Path
    if (fullPath && fullPath.length > 0) {
      ctx.strokeStyle = "#3b82f6"; // Blue path
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(fullPath[0].x * CELL_SIZE + CELL_SIZE/2, fullPath[0].y * CELL_SIZE + CELL_SIZE/2);
      
      for (let i = 1; i < fullPath.length; i++) {
        ctx.lineTo(fullPath[i].x * CELL_SIZE + CELL_SIZE/2, fullPath[i].y * CELL_SIZE + CELL_SIZE/2);
      }
      ctx.stroke();
    }
    
    // Draw Start and End
    ctx.fillStyle = "#10b981"; 
    ctx.beginPath();
    ctx.arc(fullPath[0].x * CELL_SIZE + CELL_SIZE/2, fullPath[0].y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ef4444"; 
    ctx.beginPath();
    ctx.arc(fullPath[fullPath.length-1].x * CELL_SIZE + CELL_SIZE/2, fullPath[fullPath.length-1].y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight Active Instruction Point
    if (instructions.length > 0 && activeInstructionIdx < instructions.length) {
        const activeInst = instructions[activeInstructionIdx];
        
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#f43f5e"; 
        
        ctx.beginPath();
        ctx.arc(activeInst.x * CELL_SIZE + CELL_SIZE/2, activeInst.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

  }, [mapData, fullPath, instructions, activeInstructionIdx]);


  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contextual Voice Nav Assistant</h1>
          <p className="text-muted-foreground">Spatial LLM integration for human-like, visually-anchored routing instructions.</p>
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
                aria-label="Interactive map showing semantic landmarks and turn points"
              />
              
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Semantic Landmark</div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500"></div> Route</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]"></div> Next Turn Marker</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-blue-500/20 shadow-sm">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/20 pb-4 border-b border-blue-100 dark:border-blue-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-500" />
                    Assistant Brain
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Contextual LLM Mode</label>
                  <p className="text-xs text-muted-foreground w-48">Use natural language tied to visual surroundings rather than raw distances.</p>
                </div>
                <Switch 
                  checked={useContextualLLM}
                  onCheckedChange={setUseContextualLLM}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

            </CardContent>
          </Card>

          <Card className="border shadow-sm border-blue-500/50 bg-blue-50/10 dark:bg-blue-950/20">
            <CardHeader className="pb-2 border-b border-blue-500/10">
              <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
                Live Audio Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="space-y-4">
                  {instructions.length > 0 && (
                      <div className="p-4 rounded-xl bg-background border shadow-sm relative overflow-hidden">
                          {useContextualLLM && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -mr-10 -mt-10"></div>}
                          <p className="text-lg font-medium relative z-10">
                             "{instructions[activeInstructionIdx]?.text}"
                          </p>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Mode</p>
                        <p className="font-mono text-sm">{useContextualLLM ? 'Semantic' : 'Metric'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Leg</p>
                        <p className="font-mono text-sm">{activeInstructionIdx + 1} / {instructions.length}</p>
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
