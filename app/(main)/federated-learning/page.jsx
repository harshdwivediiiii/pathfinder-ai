"use client";

import React, { useState, useEffect, useRef } from "react";
import { initializeFederatedClients, performLocalTraining, aggregateGlobalModel } from "./_components/federated-algorithm";
import { Lock, Server, Smartphone, ShieldCheck, DownloadCloud, UploadCloud, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FederatedLearningPage() {
  const canvasRef = useRef(null);
  
  const [numClients, setNumClients] = useState([10]); 
  const [clients, setClients] = useState([]);
  const [globalModel, setGlobalModel] = useState([0, 0]);
  const [round, setRound] = useState(0);
  const [status, setStatus] = useState("Idle");

  // Canvas scaling
  const WIDTH = 600;
  const HEIGHT = 400;

  useEffect(() => {
    setClients(initializeFederatedClients(numClients[0]));
    setGlobalModel([0, 0]);
    setRound(0);
    setStatus("Idle - Ready for Training");
  }, [numClients]);

  const runFederatedRound = async () => {
    setStatus("Broadcasting Global Model...");
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));
    
    // Clients train locally
    setStatus("Local On-Device Training (No data shared)...");
    const trainedClients = performLocalTraining(clients, 5, 0.1);
    setClients(trainedClients);
    
    await new Promise(r => setTimeout(r, 800));
    
    // Server aggregates
    setStatus("Aggregating Encrypted Weight Updates...");
    const newGlobalModel = aggregateGlobalModel(trainedClients);
    
    await new Promise(r => setTimeout(r, 600));
    
    setGlobalModel(newGlobalModel);
    
    // Reset client update flags for next round
    setClients(trainedClients.map(c => ({ ...c, hasUpdate: false })));
    setRound(r => r + 1);
    setStatus("Global Model Updated.");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw server in center
    const serverX = WIDTH / 2;
    const serverY = HEIGHT / 2;
    
    // Draw connections
    clients.forEach(client => {
      const cx = 50 + client.x * (WIDTH - 100);
      const cy = 50 + client.y * (HEIGHT - 100);
      
      ctx.beginPath();
      ctx.moveTo(serverX, serverY);
      ctx.lineTo(cx, cy);
      
      if (status.includes("Broadcasting")) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"; // Sky blue
          ctx.setLineDash([5, 5]);
      } else if (status.includes("Aggregating") && client.hasUpdate) {
          ctx.strokeStyle = "rgba(16, 185, 129, 0.4)"; // Emerald
          ctx.setLineDash([5, 5]);
      } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.setLineDash([]);
      }
      
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw client
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = status.includes("Training") ? "#f59e0b" : "#1e293b";
      ctx.fill();
      ctx.strokeStyle = status.includes("Training") ? "#fbbf24" : "#475569";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw lock icon indicating privacy
      ctx.fillStyle = "#10b981";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔒", cx, cy + 4);
    });

    // Draw server
    ctx.beginPath();
    ctx.arc(serverX, serverY, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    
    // Server glow if updating
    if (status.includes("Aggregating") || status.includes("Updated")) {
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 15;
    }
    
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.shadowBlur = 0; // reset
    
    ctx.fillStyle = "#60a5fa";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("☁️", serverX, serverY + 8);

  }, [clients, status, globalModel]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
          <Lock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Federated Learning for Privacy</h1>
          <p className="text-muted-foreground">Train traffic prediction models without raw location data ever leaving the user's device.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-4 flex justify-center items-center overflow-x-auto relative min-h-[450px]">
              <canvas 
                ref={canvasRef} 
                width={WIDTH} 
                height={HEIGHT} 
                className="bg-slate-950 rounded-md shadow-inner"
                style={{ width: WIDTH, height: HEIGHT }}
                aria-label="Interactive map showing federated learning nodes"
              />
              
              <div className="absolute top-6 left-6 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg border border-border">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Global Traffic Model</p>
                <div className="text-sm font-mono flex flex-col gap-1">
                    <span>w1: <span className="text-blue-400">{globalModel[0].toFixed(4)}</span></span>
                    <span>w2: <span className="text-blue-400">{globalModel[1].toFixed(4)}</span></span>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex justify-center pointer-events-none">
                 <Badge variant="secondary" className="px-4 py-2 text-sm shadow-xl border-border bg-slate-800 text-slate-200">
                    {status}
                 </Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-emerald-500/20 shadow-sm">
            <CardHeader className="bg-emerald-50 dark:bg-emerald-950/20 pb-4 border-b border-emerald-100 dark:border-emerald-900/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Pipeline Controls
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    Participating Devices
                  </label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">{numClients[0]} nodes</span>
                </div>
                <Slider 
                  value={numClients} 
                  onValueChange={setNumClients} 
                  min={3} max={50} step={1} 
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">Adjust the number of decentralized devices training the model.</p>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700" 
                onClick={runFederatedRound}
                disabled={status !== "Idle - Ready for Training" && status !== "Global Model Updated."}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Training Round
              </Button>

            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-500" />
                  Aggregation Stats
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Round {round}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><DownloadCloud className="w-3 h-3"/> Raw Data Exported</span>
                    <span className="font-mono font-medium text-emerald-600">0 Bytes</span>
                  </div>
                  <div className="flex justify-between text-sm items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-muted-foreground flex items-center gap-1"><UploadCloud className="w-3 h-3"/> Weights Transferred</span>
                    <span className="font-mono font-medium text-blue-600">{numClients[0] * 2} params</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    The cloud server never sees GPS coordinates or individual trajectories, completely anonymizing the traffic model.
                  </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
