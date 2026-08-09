"use client";

import React, { useState, useEffect } from "react";
import { generateTelemetry, predictBurnout } from "./_components/lstm-algorithm";
import { Activity, HeartPulse, Brain, AlertTriangle, ShieldCheck, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function BurnoutDetectionPage() {
  const [profile, setProfile] = useState("healthy");
  const [telemetry, setTelemetry] = useState([]);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
      const data = generateTelemetry(profile);
      setTelemetry(data);
      setPrediction(predictBurnout(data));
  }, [profile]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
          <HeartPulse className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictive Burnout Detection</h1>
          <p className="text-muted-foreground">Time-series LSTM model that analyzes behavioral telemetry to proactively prevent learner churn.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Data Source */}
        <div className="space-y-6">
          <Card className="border-rose-500/20 shadow-sm h-full flex flex-col">
            <CardHeader className="bg-rose-50 dark:bg-rose-950/20 pb-4 border-b border-rose-100 dark:border-rose-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Activity className="w-5 h-5 text-rose-500" />
                 Telemetry Feed (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6">
              
              <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Select User Behavior Profile</label>
                  <Select value={profile} onValueChange={setProfile}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy Pacing (Sustainable)</SelectItem>
                      <SelectItem value="burning_out">Cramming & Drop-off (High Risk)</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              
              <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Raw Input Data</h4>
                  
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                      {telemetry.map((day, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border flex justify-between items-center text-sm">
                              <span className="font-medium text-slate-500">Day {day.day}</span>
                              <div className="flex gap-4 font-mono">
                                  <span className="text-blue-600">{day.sessionLength}m</span>
                                  <span className={day.quizScore >= 70 ? 'text-emerald-600' : 'text-rose-600'}>
                                      Score: {day.quizScore}
                                  </span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className={`border shadow-sm transition-colors duration-500 ${prediction?.interventionRequired ? 'border-rose-500 shadow-rose-500/10' : 'border-emerald-500/30'}`}>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    LSTM Prediction Model
                </div>
                {prediction?.interventionRequired ? (
                    <Badge variant="destructive" className="flex gap-1 items-center bg-rose-500">
                        <AlertTriangle className="w-3 h-3" /> Critical Risk
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 flex gap-1 items-center">
                        <ShieldCheck className="w-3 h-3" /> Healthy
                    </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
               
               <div>
                  <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Calculated Burnout Probability</span>
                      <span className={`text-3xl font-bold font-mono ${prediction?.interventionRequired ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {prediction?.riskScore}%
                      </span>
                  </div>
                  <Progress 
                      value={prediction?.riskScore} 
                      className="h-3" 
                      indicatorClassName={prediction?.interventionRequired ? 'bg-rose-500' : 'bg-emerald-500'} 
                  />
               </div>
               
               <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Identified Risk Factors</h4>
                  
                  {prediction?.factors.length === 0 ? (
                      <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400 flex items-start gap-3 border border-emerald-200 dark:border-emerald-900/50">
                          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                          <p className="text-sm">No negative behavioral patterns detected. User is demonstrating sustainable learning habits.</p>
                      </div>
                  ) : (
                      <div className="space-y-2">
                          {prediction?.factors.map((factor, idx) => (
                              <div key={idx} className="p-3 bg-rose-50 text-rose-800 rounded-lg dark:bg-rose-900/20 dark:text-rose-400 flex items-start gap-3 border border-rose-200 dark:border-rose-900/50 text-sm">
                                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                                  <span>{factor}</span>
                              </div>
                          ))}
                      </div>
                  )}
               </div>
               
               {prediction?.interventionRequired && (
                   <div className="p-4 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-300">
                       <h4 className="font-bold flex items-center gap-2 mb-2">
                           <Info className="w-4 h-4" /> System Intervention Triggered
                       </h4>
                       <p className="text-sm">
                           The AI has automatically paused heavy technical modules. The user's dashboard has been switched to "Deload Mode", offering light gamified reviews and encouraging a 48-hour break to restore cognitive capacity.
                       </p>
                   </div>
               )}
               
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
