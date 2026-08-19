"use client";

import React, { useState, useEffect } from "react";
import { WebGLVisualizerEngine } from "./_components/webgl-engine";
import { Box, Layers, Play, Pause, SkipBack, SkipForward, Code, Terminal, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WebGLVisualizerPage() {
  const [engine] = useState(new WebGLVisualizerEngine());
  
  const sampleCode = `function main() {
    let obj = { data: 50 }; // Allocate memory
    calculate(obj);
}

function calculate(ref) {
    // Operations...
} // ref lost, garbage collection triggered

main();`;

  const [frames, setFrames] = useState([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
      // Parse the mock code to generate frames on mount
      engine.parseCode(sampleCode);
      setFrames(engine.getAllFrames());
  }, [engine, sampleCode]);

  useEffect(() => {
      let interval;
      if (isPlaying && currentFrameIdx < frames.length - 1) {
          interval = setInterval(() => {
              setCurrentFrameIdx(prev => prev + 1);
          }, 1500); // 1.5 seconds per frame for visibility
      } else if (currentFrameIdx >= frames.length - 1) {
          setIsPlaying(false);
      }
      return () => clearInterval(interval);
  }, [isPlaying, currentFrameIdx, frames.length]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const reset = () => { setIsPlaying(false); setCurrentFrameIdx(0); };
  
  const currentFrame = frames[currentFrameIdx];

  const getColorClass = (colorName) => {
      switch(colorName) {
          case 'blue': return 'bg-blue-500 border-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
          case 'purple': return 'bg-purple-500 border-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
          case 'green': return 'bg-emerald-500 border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
          case 'red': return 'bg-red-500 border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
          default: return 'bg-gray-500 border-gray-600';
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Box className="w-10 h-10 text-sky-500" />
            3D Code Execution Visualizer
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Simulate WebGL physics to watch functions physically push onto the Call Stack.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CODE & CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-sky-500/20 shadow-lg shadow-sky-500/5 h-full flex flex-col">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-sky-500" /> Source Code
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-6 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-relaxed overflow-x-auto">
                    <pre>{sampleCode}</pre>
                </div>
                
                <div className="p-4 border-t bg-background mt-auto space-y-4">
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" size="icon" onClick={reset} disabled={currentFrameIdx === 0}>
                            <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button 
                            className={`w-32 gap-2 shadow-md ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-600 hover:bg-sky-700'}`}
                            onClick={togglePlay}
                            disabled={currentFrameIdx >= frames.length - 1}
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isPlaying ? 'Pause' : 'Play Anim'}
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setCurrentFrameIdx(p => Math.min(p + 1, frames.length - 1))}
                            disabled={currentFrameIdx >= frames.length - 1}
                        >
                            <SkipForward className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2">
                        <div 
                            className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `\${(currentFrameIdx / Math.max(frames.length - 1, 1)) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-center text-xs font-mono text-muted-foreground">Frame {currentFrameIdx} / {frames.length - 1}</p>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* 3D WEBGL SIMULATION VIEWPORT */}
        <div className="lg:col-span-8 space-y-6">
            <Card className="h-[600px] border-dashed flex flex-col relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
                <CardHeader className="bg-black/40 backdrop-blur border-b absolute top-0 w-full z-10">
                    <CardTitle className="text-base flex items-center gap-2 text-sky-100">
                        <Terminal className="w-4 h-4 text-sky-400" />
                        Execution Context Output: <span className="font-mono text-sky-300 animate-pulse">{currentFrame?.message}</span>
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 p-6 pt-24 relative flex items-end justify-around">
                    
                    {/* Simulated 3D Call Stack */}
                    <div className="w-1/3 h-[400px] border-b-4 border-x-2 border-sky-500/30 rounded-b-xl relative flex flex-col justify-end p-4 pb-2 perspective-1000">
                        <div className="absolute -top-8 left-0 w-full text-center text-sky-200/50 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                            <Layers className="w-4 h-4"/> Call Stack
                        </div>
                        
                        {currentFrame?.callStack.map((block) => (
                            <div 
                                key={block.id} 
                                className={`w-full h-16 rounded-lg border-b-4 text-white font-bold flex items-center justify-center mb-2 transition-all duration-500 transform hover:scale-105 ${getColorClass(block.color)} animate-in slide-in-from-top-12 fade-in`}
                                style={{ transform: 'rotateX(10deg)' }}
                            >
                                {block.name}
                            </div>
                        ))}
                    </div>

                    {/* Simulated 3D Memory Heap */}
                    <div className="w-1/3 h-[400px] border-2 border-dashed border-emerald-500/30 rounded-full relative flex items-center justify-center perspective-1000">
                        <div className="absolute -top-8 left-0 w-full text-center text-emerald-200/50 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                            <Box className="w-4 h-4"/> Memory Heap
                        </div>

                        {currentFrame?.heap.map(block => (
                            <div 
                                key={block.id}
                                className={`w-32 h-32 rounded-2xl border-b-8 flex flex-col items-center justify-center text-white font-bold transition-all duration-700 transform ${getColorClass(block.color)} ${!block.isReferenced ? 'opacity-50 grayscale scale-95' : 'animate-in zoom-in-50 spin-in-12'}`}
                                style={{ transform: 'rotateX(20deg) rotateY(-10deg)' }}
                            >
                                <span>{block.type}</span>
                                <span className="text-xs font-mono mt-1 opacity-70">Size: {block.size}kb</span>
                                {!block.isReferenced && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-[1px]">
                                        <Trash2 className="w-8 h-8 text-red-400 animate-pulse" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Garbage Collection Animation Effect */}
                        {currentFrame?.action === 'GARBAGE_COLLECTION' && (
                            <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping opacity-20"></div>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
