"use client";

import { useState } from "react";
import { predictBurnoutScore } from "./_components/burnout-model";
import { Brain, HeartPulse, Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BurnoutPredictorPage() {
  const [satisfaction, setSatisfaction] = useState(7);
  const [hours, setHours] = useState(40);
  const [negativeJournals, setNegativeJournals] = useState(1);
  const [daysSincePTO, setDaysSincePTO] = useState(30);
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      const score = await predictBurnoutScore({
        satisfaction,
        hours,
        negativeJournals,
        daysSincePTO
      });
      setPrediction(score);
    } catch (error) {
      console.error("Failed to predict burnout:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  const resetForm = () => {
    setSatisfaction(7);
    setHours(40);
    setNegativeJournals(1);
    setDaysSincePTO(30);
    setPrediction(null);
  };

  const getStatusColor = (score) => {
    if (score < 0.4) return "text-emerald-500 border-emerald-500 bg-emerald-500/10";
    if (score < 0.7) return "text-amber-500 border-amber-500 bg-amber-500/10";
    return "text-rose-500 border-rose-500 bg-rose-500/10";
  };

  const getRecommendation = (score) => {
    if (score < 0.4) {
      return {
        title: "Looking Good",
        message: "You seem to be in a healthy spot. Keep maintaining your work-life balance!",
        action: "Keep it up"
      };
    }
    if (score < 0.7) {
      return {
        title: "Warning Signs",
        message: "You're showing early signs of burnout. It might be a good idea to schedule some PTO soon.",
        action: "Plan PTO"
      };
    }
    return {
      title: "High Risk of Burnout",
      message: "Your indicators suggest severe burnout. Please prioritize your mental health, consider taking immediate leave, or exploring internal transfers.",
      action: "Explore Internal Transfers"
    };
  };

  return (
    <div className="container max-w-4xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
          <Brain className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">TensorFlow.js ML Model</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Predictive <span className="text-gradient-primary">Burnout & Churn.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Adjust the sliders below to simulate your recent check-ins and journal sentiment. Our ML model will predict your likelihood of burnout in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inputs */}
        <Card className="glass border-border rounded-3xl">
          <CardHeader>
            <CardTitle>Historical Inputs</CardTitle>
            <CardDescription>Simulate your recent activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Average Job Satisfaction</label>
                <span className="text-sm text-muted-foreground font-mono">{satisfaction} / 10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={satisfaction} onChange={(e) => setSatisfaction(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Weekly Work Hours</label>
                <span className="text-sm text-muted-foreground font-mono">{hours} hrs</span>
              </div>
              <input 
                type="range" min="30" max="80" 
                value={hours} onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Negative Journal Entries (Weekly)</label>
                <span className="text-sm text-muted-foreground font-mono">{negativeJournals}</span>
              </div>
              <input 
                type="range" min="0" max="7" 
                value={negativeJournals} onChange={(e) => setNegativeJournals(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Days Since Last PTO</label>
                <span className="text-sm text-muted-foreground font-mono">{daysSincePTO} days</span>
              </div>
              <input 
                type="range" min="0" max="365" 
                value={daysSincePTO} onChange={(e) => setDaysSincePTO(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <Button 
              onClick={handlePredict} 
              disabled={isPredicting}
              className="w-full mt-4 h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
            >
              {isPredicting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Training & Predicting...</>
              ) : (
                <><Brain className="mr-2 h-4 w-4" /> Run Prediction Model</>
              )}
            </Button>
            
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="glass border-border rounded-3xl flex flex-col">
          <CardHeader>
            <CardTitle>ML Prediction Results</CardTitle>
            <CardDescription>Real-time inference via TensorFlow.js</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {prediction !== null ? (
              <div className="space-y-8 w-full text-center fade-in">
                <div className={`mx-auto w-40 h-40 rounded-full border-8 flex flex-col items-center justify-center transition-colors duration-500 ${getStatusColor(prediction)}`}>
                  <span className="text-sm font-bold opacity-80 mb-[-5px]">Probability</span>
                  <span className="text-4xl font-black">{(prediction * 100).toFixed(1)}%</span>
                </div>
                
                <div className="space-y-3 bg-background/50 p-6 rounded-2xl border border-border">
                  <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    {getRecommendation(prediction).title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getRecommendation(prediction).message}
                  </p>
                  <Button variant="outline" className="mt-4 w-full">
                    {getRecommendation(prediction).action}
                  </Button>
                </div>

                <Button variant="ghost" onClick={resetForm} className="text-muted-foreground">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset Simulation
                </Button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground space-y-4">
                <HeartPulse className="h-16 w-16 mx-auto opacity-20" />
                <p>Adjust your inputs and run the prediction model to see your burnout probability.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
