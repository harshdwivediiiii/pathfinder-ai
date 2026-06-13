"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Send, CheckCircle2, ShieldAlert, FileText, Loader2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { assessBurnout, getBurnoutAssessments } from "@/actions/burnout";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BurnoutCoachPage() {
  const [symptoms, setSymptoms] = useState("");
  const [workload, setWorkload] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentAssessment, setCurrentAssessment] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getBurnoutAssessments();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentAssessment(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!symptoms.trim() || !workload.trim()) {
      toast.error("Please provide both your symptoms and workload details.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await assessBurnout(symptoms, workload);
      if (res.success) {
        toast.success("Burnout assessment generated successfully!");
        setSymptoms("");
        setWorkload("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to assess burnout");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Script copied to clipboard!");
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <HeartPulse className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Burnout Coach</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Protect Your <span className="text-gradient-primary">Energy & Peace.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tell us how you're feeling and what's on your plate. We'll assess your burnout risk and give you professional scripts to set boundaries and push back.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Start Assessment</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">How are you feeling?</label>
                <Textarea
                  placeholder="E.g., I'm exhausted, having trouble sleeping, dreading checking my email..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">What's your current workload?</label>
                <Textarea
                  placeholder="E.g., I'm managing 3 projects meant for 2 people, working 60 hours a week..."
                  value={workload}
                  onChange={(e) => setWorkload(e.target.value)}
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !symptoms.trim() || !workload.trim()}
                className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Assess Risk & Generate Scripts
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Assessments</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentAssessment(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentAssessment?.id === item.id 
                        ? "bg-rose-500/10 border border-rose-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ListChecks className={`h-4 w-4 shrink-0 ${currentAssessment?.id === item.id ? "text-rose-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">Assessment</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "MMM d, yyyy")}</p>
                      </div>
                      <div className="ml-auto font-black text-rose-500 text-xs px-2 py-1 bg-rose-500/10 rounded-full">
                        {item.assessment.riskLevel}
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
            {currentAssessment ? (
              <motion.div
                key={currentAssessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 p-6 glass rounded-3xl border border-border items-center">
                  <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center shrink-0 ${
                    currentAssessment.assessment.riskLevel.includes("Low") ? 'border-emerald-500 text-emerald-500' : 
                    currentAssessment.assessment.riskLevel.includes("Moderate") ? 'border-amber-500 text-amber-500' : 
                    'border-rose-500 text-rose-500'
                  }`}>
                    <div className="text-center">
                      <span className="text-sm font-bold block mb-[-5px]">Risk:</span>
                      <span className="text-xl font-black uppercase">{currentAssessment.assessment.riskLevel}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-bold">Coach's Assessment</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentAssessment.assessment.empatheticSummary}
                    </p>
                  </div>
                </div>

                {/* Immediate Actions */}
                <div className="p-6 glass rounded-3xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4">
                    <ShieldAlert className="h-5 w-5" />
                    Immediate Actions
                  </h3>
                  <ul className="space-y-3">
                    {currentAssessment.assessment.immediateActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-amber-500 mt-1">•</span>
                        <span className="text-sm text-foreground">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Scripts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-rose-500" />
                    Boundary-Setting Scripts
                  </h3>
                  {currentAssessment.assessment.scripts.map((script, idx) => (
                    <div key={idx} className="p-6 glass rounded-3xl border border-border group relative overflow-hidden">
                      <h4 className="font-bold text-rose-500 mb-2">{script.scenario}</h4>
                      <p className="text-sm text-foreground italic bg-background/50 p-4 rounded-xl border border-border/50">
                        "{script.script}"
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(script.script)}
                        className="mt-4 text-xs font-bold rounded-xl"
                      >
                        Copy Script
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <HeartPulse className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No assessments yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Fill out the form to get personalized boundary scripts and advice.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
