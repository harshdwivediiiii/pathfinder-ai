"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { generateVascularNetwork, calculateBiomechanicalPath } from "./_components/biomechanics-algorithm";
import { HeartPulse, Droplet, Zap, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export default function VascularRouterPage() {
  const canvasRef = useRef(null);
  
  const [graphData, setGraphData] = useState(null);
  
  // Simulation Parameters
  const [botPropulsion, setBotPropulsion] = useState([8.0]);
  const [bloodPressure, setBloodPressure] = useState([1.0]); // 1.0 is normal, 2.0 is high BP
  
  // Metrics
  const [metrics, setMetrics] = useState({ pathLength: 0, energyUsed: 0, status: "Calculating" });

  // Initialize graph once
  useEffect(() => {
    const graph = generateVascularNetwork();
    setGraphData(graph);
  }, []);

  // Render loop
  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Resize for high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Define Start (Injection site top-left) and Goal (Tumor bottom-right)
    const startNode = "n_0_0";
    const goalNode = "n_9_14"; // row 9, col 14
    
    // Calculate Path
    const { path, totalEnergy } = calculateBiomechanicalPath(
      graphData, 
      startNode, 
      goalNode, 
      botPropulsion[0], 
      bloodPressure[0]
    );

    // Update Telemetry
    if (path.length > 0) {
      setMetrics({
        pathLength: path.length,
        energyUsed: totalEnergy.toFixed(2),
        status: "Path Acquired"
      });
    } else {
      setMetrics({
        pathLength: 0,
        energyUsed: "Infinity",
        status: "Thrombosis / Current too strong"
      });
    }

    // Animation state
    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.05;
      
      // Clear background
      ctx.fillStyle = "#0f172a"; // slate-950
      ctx.fillRect(0, 0, width, height);

      // 1. Draw all edges (Vascular Network)
      // To avoid drawing reverse edges twice, filter out the ones with _rev
      const uniqueEdges = graphData.edges.filter(e => !e.id.includes("_rev"));
      
      uniqueEdges.forEach(edge => {
        const source = graphData.nodes.find(n => n.id === edge.source);
        const target = graphData.nodes.find(n => n.id === edge.target);
        
        if (!source || !target) return;
        
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        
        // Color based on type
        if (edge.type === 'artery') {
          ctx.strokeStyle = "rgba(225, 29, 72, 0.4)"; // Rose-600
        } else if (edge.type === 'vein') {
          ctx.strokeStyle = "rgba(37, 99, 235, 0.4)"; // Blue-600
        } else {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.3)"; // Slate-400
        }
        
        ctx.lineWidth = edge.diameter;
        ctx.lineCap = "round";
        ctx.stroke();
        
        // Draw flow direction indicators
        if (edge.type === 'artery' || edge.type === 'vein') {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          
          // Animate small blood particles flowing
          const flowSpeed = edge.baseFlowVelocity * bloodPressure[0];
          // Determine actual visual direction based on flowDir flag
          // if flowDir is 1, flows source->target. if -1, flows target->source.
          const isReversed = edge.flowDir === -1;
          
          const progress = (time * flowSpeed * 0.1) % 1;
          const particleProgress = isReversed ? 1 - progress : progress;
          
          const pX = source.x + (target.x - source.x) * particleProgress;
          const pY = source.y + (target.y - source.y) * particleProgress;
          
          ctx.beginPath();
          ctx.arc(pX, pY, edge.diameter / 3, 0, Math.PI * 2);
          ctx.fillStyle = edge.type === 'artery' ? "rgba(244, 63, 94, 0.8)" : "rgba(96, 165, 250, 0.8)";
          ctx.fill();
        }
      });

      // 2. Draw the Calculated Micro-bot Path
      if (path.length > 0) {
        ctx.beginPath();
        
        const firstNode = graphData.nodes.find(n => n.id === path[0]);
        if (firstNode) ctx.moveTo(firstNode.x, firstNode.y);
        
        for (let i = 1; i < path.length; i++) {
          const node = graphData.nodes.find(n => n.id === path[i]);
          if (node) ctx.lineTo(node.x, node.y);
        }
        
        // Glowing cyan path
        ctx.strokeStyle = "#22d3ee"; // Cyan-400
        ctx.lineWidth = 4;
        
        // Add glow effect
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 15;
        
        // Make path pulse
        const pulse = (Math.sin(time * 3) + 1) / 2; // 0 to 1
        ctx.globalAlpha = 0.5 + (pulse * 0.5);
        
        ctx.stroke();
        
        // Reset effects
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        
        // Draw the microbot traversing the path
        const botProgress = (time * 0.5) % path.length;
        const pathIndex = Math.floor(botProgress);
        const nextIndex = Math.min(pathIndex + 1, path.length - 1);
        
        if (pathIndex < path.length) {
          const n1 = graphData.nodes.find(n => n.id === path[pathIndex]);
          const n2 = graphData.nodes.find(n => n.id === path[nextIndex]);
          
          if (n1 && n2) {
            const t = botProgress - pathIndex;
            const bX = n1.x + (n2.x - n1.x) * t;
            const bY = n1.y + (n2.y - n1.y) * t;
            
            ctx.beginPath();
            ctx.arc(bX, bY, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // 3. Draw Start and End Markers
      const sNode = graphData.nodes.find(n => n.id === startNode);
      if (sNode) {
        ctx.beginPath();
        ctx.arc(sNode.x, sNode.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#22d3ee"; // Cyan
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      const tNode = graphData.nodes.find(n => n.id === goalNode);
      if (tNode) {
        // Tumor pulsating
        const tumorPulse = (Math.sin(time * 4) + 1) * 2;
        ctx.beginPath();
        ctx.arc(tNode.x, tNode.y, 12 + tumorPulse, 0, Math.PI * 2);
        ctx.fillStyle = "#e11d48"; // Rose-600
        ctx.fill();
        
        // Inner core
        ctx.beginPath();
        ctx.arc(tNode.x, tNode.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#4c0519";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [graphData, botPropulsion, bloodPressure]);

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <HeartPulse className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Nanomedicine Router</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Vascular Biomechanics <span className="text-gradient-primary">Engine.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Route targeted micro-bots through a patient-specific vascular graph. The A* engine factors in fluid drag and blood pressure to bypass high-velocity arteries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Biomechanical Settings</CardTitle>
            <CardDescription>Adjust patient vitals and bot hardware.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-500" /> Bot Propulsion
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{botPropulsion[0]} mm/s</span>
              </div>
              <Slider 
                value={botPropulsion} 
                onValueChange={setBotPropulsion} 
                max={20} 
                min={2} 
                step={0.5}
                className="py-4"
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                Lower propulsion forces the router to find low-resistance capillary bypasses instead of main arteries.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-rose-500" /> Blood Pressure
                </label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">x{bloodPressure[0]}</span>
              </div>
              <Slider 
                value={bloodPressure} 
                onValueChange={setBloodPressure} 
                max={2.5} 
                min={0.5} 
                step={0.1}
                className="py-4"
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                Increases vascular flow velocity globally, drastically increasing fluid drag for upstream traversal.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Routing Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-500"/> Status
                </p>
                <p className={`text-sm font-bold ${metrics.status === 'Path Acquired' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {metrics.status}
                </p>
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Energy Cost</p>
                  <p className="text-xl font-black text-foreground">{metrics.energyUsed}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 text-right">Nodes</p>
                  <p className="text-xl font-black text-foreground text-right">{metrics.pathLength}</p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 2D Canvas Visualizer */}
        <Card className="col-span-1 lg:col-span-3 glass border-border rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-background/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-rose-500" /> MRI Vascular Network
                </CardTitle>
                <CardDescription>
                  Injection Site (Cyan) to Tumor Site (Red). The pathfinder constantly recalculates the route of least fluid resistance.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative min-h-[600px]">
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: "block" }}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
