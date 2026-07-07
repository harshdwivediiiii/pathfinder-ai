"use client";

import { useState, useEffect } from "react";
import { generateEscapePlan, getEscapePlans } from "@/actions/toxic-escape";
import { 
  HeartPulse, ShieldAlert, Sparkles, Brain, 
  DoorOpen, MessagesSquare, Shield 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ToxicWorkplacePage() {
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [role, setRole] = useState("");
  const [timeline, setTimeline] = useState("3 Months");
  const [activePlan, setActivePlan] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function loadHistory() {
      const res = await getEscapePlans();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActivePlan(res.data[0].escapeData);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (symptoms.length < 20) return;
    
    setLoading(true);
    const res = await generateEscapePlan(symptoms, role, timeline);
    
    if (res.success) {
      setActivePlan(res.data);
      setHistory(prev => [res.data, ...prev]);
      toast.success("Escape plan generated. Stay strong!");
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate plan");
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (!score) return "text-amber-500";
    if (score < 40) return "text-amber-500";
    if (score < 75) return "text-orange-500";
    return "text-destructive";
  };

  const getScoreBg = (score) => {
    if (!score) return "bg-amber-500/10 border-amber-500/20";
    if (score < 40) return "bg-amber-500/10 border-amber-500/20";
    if (score < 75) return "bg-orange-500/10 border-orange-500/20";
    return "bg-destructive/10 border-destructive/20";
  };

  // Helper to handle legacy vs new plan schema
  const planData = activePlan;
  const isLegacy = planData && !planData.toxicityScore;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-[0.2em]">
              <ShieldAlert className="h-3 w-3" />
              Covert Tool
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Toxic Workplace <span className="text-destructive">Escape Plan</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl">
              Stuck in a bad environment? Tell us what's happening. The AI will generate a covert exit strategy, mental health triage tips, and professional scripts to set boundaries today.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive to-orange-500" />
              <h3 className="font-bold text-lg mb-4">Your Situation</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Role</Label>
                  <Input
                    placeholder="e.g. Marketing Manager"
                    className="h-12 rounded-xl bg-background focus-visible:ring-destructive"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Exit Timeline</Label>
                  <select
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                  >
                    <option value="ASAP (1 Month)">ASAP (1 Month)</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="Just setting boundaries for now">Just setting boundaries for now</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5" /> Toxic Symptoms
                  </Label>
                  <Textarea
                    placeholder="Micromanagement? Unpaid overtime? Gaslighting? Describe the red flags..."
                    className="min-h-[150px] rounded-xl resize-none bg-background focus-visible:ring-destructive text-sm"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || symptoms.length < 20}
                  className="w-full h-12 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                >
                  {loading ? "Generating Strategy..." : "Build Escape Plan"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {planData ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  {/* Validation & Score Card */}
                  <div className={cn("p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6", getScoreBg(planData.toxicityScore))}>
                    {!isLegacy && (
                      <div className="text-center shrink-0">
                        <div className={cn("text-5xl font-black tabular-nums", getScoreColor(planData.toxicityScore))}>
                          {planData.toxicityScore}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">
                          Toxicity Score
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 text-center md:text-left">
                      <p className={cn("text-sm md:text-base font-semibold leading-relaxed", getScoreColor(planData.toxicityScore))}>
                        "{planData.validationMessage || planData.toxicityAssessment}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Immediate Boundaries */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <h3 className="font-bold text-lg">Immediate Boundaries</h3>
                      </div>
                      <div className="space-y-4">
                        {planData.immediateBoundaries?.map((boundary, idx) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-xl border border-border/50">
                            {isLegacy ? (
                              <span className="text-sm italic text-blue-500 block">Say this: "{boundary}"</span>
                            ) : (
                              <>
                                <span className="text-xs font-bold text-foreground block mb-1">{boundary.situation}</span>
                                <span className="text-sm italic text-blue-500 block">Say this: "{boundary.script}"</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mental Health Triage */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <HeartPulse className="h-5 w-5 text-rose-500" />
                        <h3 className="font-bold text-lg">Mental Triage</h3>
                      </div>
                      <ul className="space-y-3">
                        {isLegacy ? (
                          <li className="flex gap-2 text-sm text-muted-foreground items-start">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="leading-snug">Take breaks and disconnect emotionally to preserve peace.</span>
                          </li>
                        ) : planData.mentalTriage?.map((item, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-muted-foreground items-start">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Covert Search & Exit Strategy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="h-5 w-5 text-purple-500" />
                        <h3 className="font-bold text-lg">Covert Job Search</h3>
                      </div>
                      <ul className="space-y-3">
                        {isLegacy ? (
                          <li className="flex gap-2 text-sm text-muted-foreground items-start">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                            <span className="leading-snug">Network quietly and update your resume.</span>
                          </li>
                        ) : planData.covertSearch?.map((item, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-muted-foreground items-start">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <DoorOpen className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-bold text-lg">Exit Strategy</h3>
                      </div>
                      <ul className="space-y-3">
                        {isLegacy ? (
                          planData.quietExitStrategy?.map((item, idx) => (
                            <li key={idx} className="flex gap-2 text-sm text-muted-foreground items-start">
                              <div className="mt-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </div>
                              <span className="leading-snug"><strong>{item.phase}:</strong> {item.action}</span>
                            </li>
                          ))
                        ) : (
                          planData.exitStrategy?.map((item, idx) => (
                            <li key={idx} className="flex gap-2 text-sm text-muted-foreground items-start">
                              <div className="mt-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </div>
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Resignation Script */}
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <MessagesSquare className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg">Graceful Resignation Script</h3>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                      <p className="text-sm font-medium leading-relaxed italic text-foreground">
                        "{planData.resignationScript}"
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      (Remember: You don't owe them the real reason if it compromises your peace.)
                    </p>
                  </div>

                </motion.div>
              ) : (
                <div key="empty" className="h-full min-h-[500px] flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                  <div className="max-w-md space-y-4">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">No Plan Generated</h3>
                    <p className="text-muted-foreground text-sm">
                      Describe your situation on the left. The AI will provide a highly strategic, covert escape plan to protect your career and your peace.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
