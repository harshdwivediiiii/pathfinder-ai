"use client";

import React, { useState, useEffect, useRef } from "react";
import { EmotionVisionPipeline } from "./_components/cv-algorithm";
import { Camera, Smile, Eye, AlertTriangle, Video, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function EmotionAwareVideoPage() {
  const [pipeline, setPipeline] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [report, setReport] = useState(null);
  
  const frameIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const initPipeline = async () => {
        const cv = new EmotionVisionPipeline();
        await cv.initialize();
        setPipeline(cv);
        setIsReady(true);
    };
    initPipeline();
    
    return () => clearInterval(frameIntervalRef.current);
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
        clearInterval(frameIntervalRef.current);
        setIsRecording(false);
        setReport(pipeline.generatePostInterviewReport());
    } else {
        setReport(null);
        // reset pipeline in a real scenario, here we just create a new one for clean state
        const cv = new EmotionVisionPipeline();
        cv.initialize().then(() => {
            setPipeline(cv);
            setIsRecording(true);
            startTimeRef.current = Date.now();
            
            frameIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;
                const metrics = cv.processFrame({ mockBuffer: true }, elapsed);
                setCurrentMetrics(metrics);
            }, 100); // 10 FPS processing
        });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Camera className="w-10 h-10 text-rose-500" />
            Emotion-Aware Video Analysis
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Client-side computer vision pipeline extracting non-verbal emotional cues during mock interviews.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-rose-500/20 shadow-lg shadow-rose-500/5 relative overflow-hidden">
            <CardHeader className="bg-muted/30 border-b z-10 relative">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Video className="w-5 h-5" /> Webcam Feed</span>
                {isRecording && <span className="animate-pulse text-red-500 flex items-center gap-1 text-sm font-bold"><div className="w-2 h-2 rounded-full bg-red-500" /> REC</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-black aspect-video relative flex items-center justify-center">
                {isRecording ? (
                    <div className="text-white text-center">
                        <Activity className="w-16 h-16 text-rose-500 mx-auto animate-pulse opacity-50 mb-4" />
                        <p className="font-mono text-sm opacity-75 text-rose-300">Processing MediaPipe Landmarks...</p>
                        
                        {currentMetrics?.nervousMicroExpression && (
                            <div className="absolute inset-0 border-4 border-yellow-500/50 rounded pointer-events-none animate-ping opacity-20"></div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 font-medium">Camera Offline</p>
                    </div>
                )}
                
                {/* Real-time overlay HUD */}
                {isRecording && currentMetrics && (
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-mono text-white/80 bg-black/50 p-2 rounded backdrop-blur">
                        <span>Valence: {(currentMetrics.valence * 100).toFixed(0)}%</span>
                        <span>Eye Contact: {(currentMetrics.eyeContact * 100).toFixed(0)}%</span>
                        {currentMetrics.nervousMicroExpression && <span className="text-yellow-400">Micro-Expression Detected!</span>}
                    </div>
                )}
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            onClick={toggleRecording} 
            disabled={!isReady}
            variant={isRecording ? "destructive" : "default"}
            className={`w-full gap-2 transition-all shadow-md hover:shadow-lg h-14 text-lg font-semibold ${!isRecording ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
          >
            {isRecording ? "End Interview" : "Start Mock Interview"}
          </Button>
        </div>

        <div className="space-y-6">
            <Card className="h-full border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Post-Interview Dashboard
                    </CardTitle>
                    <CardDescription>Analysis of your non-verbal cues</CardDescription>
                </CardHeader>
                <CardContent>
                    {!report && !isRecording && (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                            <RefreshCw className="w-12 h-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">Complete a mock interview session to view your emotional and behavioral analysis report.</p>
                        </div>
                    )}
                    
                    {isRecording && (
                         <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                            <Activity className="w-12 h-12 text-rose-500/50 mb-4 animate-pulse" />
                            <p className="text-muted-foreground font-medium animate-pulse">Aggregating telemetry data...</p>
                        </div>
                    )}

                    {report && !isRecording && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border bg-secondary/20">
                                    <div className="flex items-center gap-2 mb-2 text-muted-foreground font-medium"><Smile className="w-4 h-4" /> Avg Valence</div>
                                    <div className="text-3xl font-bold text-green-500">{(report.averageValence * 100).toFixed(1)}%</div>
                                    <Progress value={report.averageValence * 100} className="h-1 mt-2 bg-green-100 [&>div]:bg-green-500" />
                                </div>
                                <div className="p-4 rounded-xl border bg-secondary/20">
                                    <div className="flex items-center gap-2 mb-2 text-muted-foreground font-medium"><Eye className="w-4 h-4" /> Eye Contact</div>
                                    <div className="text-3xl font-bold text-blue-500">{(report.eyeContactScore * 100).toFixed(1)}%</div>
                                    <Progress value={report.eyeContactScore * 100} className="h-1 mt-2 bg-blue-100 [&>div]:bg-blue-500" />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border bg-yellow-500/10 border-yellow-500/20">
                                <div className="flex items-center gap-2 mb-2 text-yellow-700 dark:text-yellow-500 font-semibold">
                                    <AlertTriangle className="w-4 h-4" /> Nervous Micro-Expressions
                                </div>
                                <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80 mb-2">
                                    We detected <strong>{report.nervousMicroExpressionsCount}</strong> instances of facial tension or avertive glancing.
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Timeline Graph (Simulated)</h4>
                                <div className="flex items-end h-24 gap-1 w-full bg-secondary/10 p-2 rounded border border-dashed">
                                    {report.timeline.map((point, i) => (
                                        <div 
                                            key={i} 
                                            className={`flex-1 rounded-t-sm transition-all ${point.nervousMicroExpression ? 'bg-yellow-500' : 'bg-rose-500/70'}`}
                                            style={{ height: \`\${Math.max(10, point.valence * 100)}%\` }}
                                            title=\`Valence: \${(point.valence*100).toFixed(0)}%\`
                                        ></div>
                                    ))}
                                </div>
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
