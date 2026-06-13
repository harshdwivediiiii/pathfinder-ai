"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Send, FileText, Loader2, HeartPulse, Flag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateEscapePlan, getEscapePlans } from "@/actions/toxic-workplace";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ToxicWorkplacePage() {
  const [symptoms, setSymptoms] = useState("");
  const [role, setRole] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getEscapePlans();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentPlan(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!symptoms.trim() || !role.trim()) {
      toast.error("Please fill out your symptoms and role.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateEscapePlan(symptoms, role);
      if (res.success) {
        toast.success("Escape plan generated successfully!");
        setSymptoms("");
        setRole("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to generate plan");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
          <ShieldAlert className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Toxic Workplace Escape</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Protect Your <span className="text-gradient-primary">Peace.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gaslighting? Micromanagement? Unrealistic demands? Let us validate your experience and generate a discreet, fast-track escape plan to preserve your mental health.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-red-500/20 shadow-sm">
            <h3 className="text-lg font-bold mb-4">What's going on?</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Your Role</label>
                <Input
                  placeholder="E.g., Senior Designer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Describe the Environment (Symptoms)</label>
                <Textarea
                  placeholder="E.g., My manager constantly texts me on weekends, takes credit for my work, and belittles me in team meetings..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !symptoms.trim() || !role.trim()}
                className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Environment...
                  </>
                ) : (
                  <>
                    Generate Escape Plan
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Plans</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPlan(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentPlan?.id === item.id 
                        ? "bg-red-500/10 border border-red-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flag className={`h-4 w-4 shrink-0 ${currentPlan?.id === item.id ? "text-red-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.role}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {currentPlan ? (
              <motion.div
                key={currentPlan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Validation */}
                <div className="p-6 glass rounded-3xl border border-indigo-500/30 bg-indigo-500/5">
                  <h3 className="text-lg font-bold text-indigo-500 flex items-center gap-2 mb-3">
                    <HeartPulse className="h-5 w-5" />
                    Validation & Assessment
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed italic border-l-2 border-indigo-500/50 pl-4">
                    {currentPlan.escapeData.toxicityAssessment}
                  </p>
                </div>

                {/* Boundaries */}
                <div className="p-6 glass rounded-3xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5" />
                    Immediate Boundaries to Set
                  </h3>
                  <ul className="space-y-3">
                    {currentPlan.escapeData.immediateBoundaries.map((boundary, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-amber-500 mt-1 font-bold">•</span>
                        <span className="text-sm text-foreground leading-relaxed">{boundary}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* The Escape Strategy */}
                <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                  <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2 mb-6">
                    <ShieldAlert className="h-5 w-5" />
                    Quiet Exit Strategy
                  </h3>
                  <div className="space-y-6">
                    {currentPlan.escapeData.quietExitStrategy.map((step, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-emerald-500/20">
                        <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1" />
                        <h4 className="text-sm font-bold text-foreground mb-1">{step.phase}</h4>
                        <p className="text-sm text-muted-foreground">{step.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resignation Script */}
                <div className="p-6 glass rounded-3xl border border-border relative bg-background/40">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-foreground">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Airtight Resignation Script
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {currentPlan.escapeData.resignationScript}
                  </p>
                  <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentPlan.escapeData.resignationScript)}>
                    Copy Script
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-red-500/30">
                <ShieldAlert className="h-12 w-12 text-red-500/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No escape plans yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Describe what is happening at work, and we will help you build a strategy to leave.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
