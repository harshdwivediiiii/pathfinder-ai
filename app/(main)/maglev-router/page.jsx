"use client";

import { useState, useEffect } from "react";
import { generateTrackProfile, calculateKineticProfile } from "./_components/kinetic-algorithm";
import { Activity, BatteryCharging, Zap, Train } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MaglevRouterPage() {
  const [track, setTrack] = useState([]);
  const [simulationData, setSimulationData] = useState([]);
  const [metrics, setMetrics] = useState({ totalConsumedMJ: 0, totalRecoveredMJ: 0, netEnergyMJ: 0 });

  // Physics Variables
  const [trainMass, setTrainMass] = useState([50000]); // kg (50 tons)
  const [targetSpeed, setTargetSpeed] = useState([100]); // m/s (360 km/h)
  const [regenEfficiency, setRegenEfficiency] = useState([0.85]); // 85%

  const runSimulation = () => {
    const newTrack = generateTrackProfile(100);
    setTrack(newTrack);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  useEffect(() => {
    if (track.length > 0) {
      const result = calculateKineticProfile(track, trainMass[0], targetSpeed[0], regenEfficiency[0]);
      setSimulationData(result.profile);
      setMetrics(result.metrics);
    }
  }, [track, trainMass, targetSpeed, regenEfficiency]);

  return (
    <div className="container max-w-7xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
          <Train className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Next-Gen Transit</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Maglev Kinetic <span className="text-gradient-primary">Routing.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Optimize vacuum-tube Maglev acceleration curves against track topography to maximize regenerative braking and minimize electrical grid draw.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls */}
        <Card className="col-span-1 lg:col-span-1 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Physics Parameters</CardTitle>
            <CardDescription>Adjust variables to see real-time kinetic impacts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Train Mass</label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{(trainMass[0] / 1000).toFixed(0)} Tons</span>
              </div>
              <Slider value={trainMass} onValueChange={setTrainMass} max={200000} min={10000} step={5000} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Target Cruise Speed</label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{targetSpeed[0]} m/s</span>
              </div>
              <Slider value={targetSpeed} onValueChange={setTargetSpeed} max={200} min={20} step={5} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Regen Efficiency</label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{(regenEfficiency[0] * 100).toFixed(0)}%</span>
              </div>
              <Slider value={regenEfficiency} onValueChange={setRegenEfficiency} max={1.0} min={0.3} step={0.05} />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Energy Telemetry</p>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-rose-500"/> Grid Power Consumed</p>
                <p className="text-2xl font-black text-rose-500">{metrics.totalConsumedMJ} MJ</p>
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><BatteryCharging className="w-3 h-3 text-emerald-500"/> Regen Recovered</p>
                <p className="text-2xl font-black text-emerald-500">{metrics.totalRecoveredMJ} MJ</p>
              </div>

              <div className="bg-background/50 p-3 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Activity className="w-3 h-3 text-cyan-500"/> Net Energy Draw</p>
                <p className="text-2xl font-black text-cyan-500">{metrics.netEnergyMJ} MJ</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Visualizer */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          
          <Card className="glass border-border rounded-3xl overflow-hidden">
            <CardHeader className="bg-background/30 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <Mountain className="h-4 w-4 text-slate-400" /> Track Topography & Kinetic Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-2 pl-0 min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={simulationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="distance" stroke="#64748b" tick={{fill: '#64748b'}} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="elevation" 
                    name="Elevation (m)"
                    stroke="#94a3b8" 
                    fillOpacity={1} 
                    fill="url(#colorElevation)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass border-border rounded-3xl overflow-hidden">
            <CardHeader className="bg-background/30 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-500" /> Power State (Draw vs. Regen)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-2 pl-0 min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={simulationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDraw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRegen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="distance" stroke="#64748b" tick={{fill: '#64748b'}} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="powerDrawMJ" name="Grid Draw (MJ)" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDraw)" isAnimationActive={false} stackId="1" />
                  <Area type="monotone" dataKey="regenPowerMJ" name="Regen Recovered (MJ)" stroke="#10b981" fillOpacity={1} fill="url(#colorRegen)" isAnimationActive={false} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// Temporary icon stub since Mountain isn't imported from lucide-react above
function Mountain(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  )
}
