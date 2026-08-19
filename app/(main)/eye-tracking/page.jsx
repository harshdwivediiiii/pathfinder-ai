"use client";

import React, { useState, useEffect, useRef } from "react";
import { CognitiveLoadAnalyzer } from "./_components/cognitive-load-analyzer";
import { Eye, Webcam, MousePointerClick, BrainCircuit, Activity, AlertTriangle, BookOpen, BrainCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EyeTrackingPage() {
  const [analyzer] = useState(new CognitiveLoadAnalyzer());
  const [isTracking, setIsTracking] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Hardcoded simulated paragraphs for the curriculum page
  const paragraphs = [
      { id: "p1", x: 0, y: 0, width: 800, height: 100, text: "Introduction to Recursion. Recursion is a method of solving a computational problem where the solution depends on solutions to smaller instances of the same problem." },
      { id: "p2", x: 0, y: 120, width: 800, height: 150, text: "The Base Case. A recursive function must have a condition that stops it from calling itself indefinitely. This is known as the base case. Without it, you will encounter a stack overflow error because the memory allocated for the call stack is exhausted." },
      { id: "p3", x: 0, y: 290, width: 800, height: 200, text: "Tail Call Optimization (TCO). In traditional recursion, every recursive call adds a new frame to the call stack. However, if the recursive call is the very last operation in the function (a tail call), modern compilers can optimize this by reusing the current stack frame. This prevents O(N) memory complexity and reduces it to O(1), making recursion as efficient as a standard iteration loop." }
  ];

  useEffect(() => {
      let interval;
      if (isTracking) {
          // Pass the paragraphs with simulated bounding boxes (assuming container is 800px wide)
          analyzer.startTracking(paragraphs);

          // Simulate eye tracker by tracking the mouse over the text container
          const handleMouseMove = (e) => {
              if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  setMousePos({ x, y });
                  
                  // Simulate rapid eye movements if user wiggles mouse
                  // In a real app, WebGazer handles coordinates
                  analyzer.recordGaze(x, y, 50); 
              }
          };
          
          window.addEventListener('mousemove', handleMouseMove);

          // Simulate generating analysis every 5 seconds
          interval = setInterval(() => {
              try {
                  const result = analyzer.analyzeHeatmap();
                  setAnalysisResult(result);
              } catch (e) {
                  console.error(e);
              }
          }, 3000);

          return () => {
              window.removeEventListener('mousemove', handleMouseMove);
              clearInterval(interval);
          };
      } else {
          analyzer.stopTracking();
      }
  }, [isTracking, analyzer]);

  const toggleTracking = () => {
      if (isTracking) {
          setIsTracking(false);
          // Final analysis
          try {
              setAnalysisResult(analyzer.analyzeHeatmap());
          } catch(e) { /* ignore */ }
      } else {
          setIsTracking(true);
          setAnalysisResult(null);
      }
  };

  const getHeatmapColor = (score) => {
      if (score > 80) return "bg-red-500/20 border-red-500/50";
      if (score > 50) return "bg-orange-500/20 border-orange-500/50";
      if (score > 20) return "bg-yellow-500/10 border-yellow-500/30";
      return "bg-transparent border-transparent hover:bg-muted/50";
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Eye className="w-10 h-10 text-indigo-500" />
            Cognitive Load Eye-Tracking
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Simulate WebGazer.js to probabilistically assess learner confusion via saccadic movements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-indigo-500/20 shadow-lg shadow-indigo-500/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
              <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" /> Curriculum Viewport
                  </CardTitle>
                  <CardDescription>Hover over text rapidly to simulate confusion saccades.</CardDescription>
              </div>
              <Button 
                    variant={isTracking ? "destructive" : "default"}
                    onClick={toggleTracking} 
                    className={`gap-2 transition-all shadow-md \${!isTracking ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
              >
                  {isTracking ? <Webcam className="w-4 h-4 animate-pulse" /> : <Eye className="w-4 h-4" />}
                  {isTracking ? "Stop WebGazer Calibration" : "Start Eye Tracking"}
              </Button>
            </CardHeader>
            <CardContent className="p-8 relative bg-white dark:bg-[#0a0a0a]">
                
                {/* Simulated Gaze Dot */}
                {isTracking && (
                    <div 
                        className="absolute w-8 h-8 bg-indigo-500/30 rounded-full pointer-events-none z-50 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 blur-sm"
                        style={{ left: mousePos.x, top: mousePos.y }}
                    >
                        <div className="w-2 h-2 bg-indigo-500 rounded-full blur-none"></div>
                    </div>
                )}

                <div ref={containerRef} className="space-y-6 relative max-w-3xl font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-300">
                    {paragraphs.map((p, idx) => {
                        const result = analysisResult?.find(a => a.id === p.id);
                        const isHighLoad = result && result.status !== 'normal';
                        
                        return (
                            <div 
                                key={p.id} 
                                className={`p-4 rounded-xl border-2 transition-colors duration-1000 ${result ? getHeatmapColor(result.cognitiveLoadScore) : 'border-transparent'}`}
                            >
                                {isHighLoad && (
                                    <div className={`text-xs font-sans font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${result.status === 'extreme_confusion' ? 'text-red-500' : 'text-orange-500'}`}>
                                        <AlertTriangle className="w-3 h-3" /> 
                                        {result.status.replace('_', ' ')}
                                    </div>
                                )}
                                <p>{p.text}</p>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
            <Card className="h-full border-dashed flex flex-col bg-secondary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCog className="w-5 h-5 text-indigo-500" />
                        Telemetry Analytics
                    </CardTitle>
                    <CardDescription>Real-time cognitive load matrices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                    {!isTracking && !analysisResult && (
                        <div className="text-center p-8 text-muted-foreground opacity-50 flex flex-col items-center justify-center h-full">
                            <MousePointerClick className="w-12 h-12 mb-2" />
                            <p className="text-sm">Start tracking to generate heatmaps.</p>
                        </div>
                    )}

                    {isTracking && (
                        <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-600 dark:text-indigo-400 mb-6">
                            <span className="text-sm font-bold flex items-center gap-2"><Webcam className="w-4 h-4 animate-pulse" /> Webcam Active</span>
                            <span className="text-xs font-mono">60 FPS</span>
                        </div>
                    )}

                    {analysisResult && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            {analysisResult.map((result, idx) => (
                                <div key={result.id} className="p-3 bg-background border rounded-lg shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Paragraph {idx + 1}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${result.status === 'extreme_confusion' ? 'bg-red-500 text-white' : result.status === 'high_load' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                            Score: {result.cognitiveLoadScore}/100
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
                                        <div className="bg-muted/50 p-2 rounded">
                                            <div className="opacity-70 mb-1">Fixation Time</div>
                                            <div className="font-bold text-foreground">{(result.gazeTimeMs / 1000).toFixed(1)}s</div>
                                        </div>
                                        <div className="bg-muted/50 p-2 rounded">
                                            <div className="opacity-70 mb-1">Saccades</div>
                                            <div className="font-bold text-foreground">{result.saccadeCount}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
