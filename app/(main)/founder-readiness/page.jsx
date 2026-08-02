"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Send, Loader2, Target, ShieldAlert, CheckCircle, Info, BrainCircuit, RocketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateFounderReadiness, getFounderReadinesses } from "@/actions/founder-readiness";
import { toast } from "sonner";
import { format } from "date-fns";

export default function FounderReadinessPage() {
  const [businessIdea, setBusinessIdea] = useState("");
  const [riskTolerance, setRiskTolerance] = useState("");
  const [skills, setSkills] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentReadiness, setCurrentReadiness] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getFounderReadinesses();
    if (res.readinesses) {
      setHistory(res.readinesses);
      if (res.readinesses.length > 0) {
        setCurrentReadiness(res.readinesses[0]);
      }
    }
  };

  const handleGenerate = async () => {
    if (!businessIdea.trim() || !riskTolerance || !skills.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("businessIdea", businessIdea);
      formData.append("riskTolerance", riskTolerance);
      formData.append("skills", skills);

      const res = await generateFounderReadiness(formData);

console.log("Founder Readiness Response:", res);

if (res?.error) {
  toast.error(res.error);
  return;
}
      if (res && res.id) {
        toast.success("Founder readiness analysis generated!");
        setBusinessIdea("");
        setRiskTolerance("");
        setSkills("");
        loadHistory();
      }
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
          <RocketIcon className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Startup Founder Readiness</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Are you ready to <span className="text-gradient-primary">Launch?</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get brutal, VC-level feedback on your business idea, discover your founder blind spots, and receive a 90-day transition roadmap.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Your Startup Profile</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-indigo-500 flex items-center gap-1.5">
                  <Rocket className="h-3 w-3" /> Business Idea
                </label>
                <Textarea
                  placeholder="What is the problem you're solving and who is it for? Be concise..."
                  value={businessIdea}
                  onChange={(e) => setBusinessIdea(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-indigo-500/20 rounded-2xl focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-amber-500 flex items-center gap-1.5">
                  <ShieldAlert className="h-3 w-3" /> Risk Tolerance
                </label>
                <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                  <SelectTrigger className="w-full bg-background/50 border-amber-500/20 rounded-xl h-12">
                    <SelectValue placeholder="How much risk can you handle?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low (Need side-hustle first)">Low (Need side-hustle first)</SelectItem>
                    <SelectItem value="Medium (Can bootstrap for 6 months)">Medium (Can bootstrap for 6 months)</SelectItem>
                    <SelectItem value="High (Ready to quit and go all-in)">High (Ready to quit and go all-in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-1.5">
                  <BrainCircuit className="h-3 w-3" /> Core Skills & Unfair Advantage
                </label>
                <Textarea
                  placeholder="e.g., Ex-Stripe engineer, strong network in fin-tech, zero marketing skills..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-emerald-500/20 rounded-2xl focus:border-emerald-500"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !businessIdea.trim() || !riskTolerance || !skills.trim()}
                className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold mt-2 shadow-lg shadow-orange-500/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Readiness...
                  </>
                ) : (
                  <>
                    Evaluate Founder Fit
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Analyses</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentReadiness(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentReadiness?.id === item.id 
                        ? "bg-orange-500/10 border border-orange-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RocketIcon className={`h-4 w-4 shrink-0 ${currentReadiness?.id === item.id ? "text-orange-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">Readiness Analysis</p>
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
            {currentReadiness ? (
              <motion.div
                key={currentReadiness.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score & Idea Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1 p-6 glass rounded-3xl border border-orange-500/20 flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Founder Score</p>
                    <div className="text-5xl font-black text-orange-500">
                      {currentReadiness.readinessData.founderScore}<span className="text-2xl text-orange-500/50">/100</span>
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 p-6 glass rounded-3xl border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-indigo-500" />
                      <h4 className="font-bold text-foreground">Idea & Market Feedback</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentReadiness.readinessData.businessIdeaFeedback}
                    </p>
                  </div>
                </div>

                {/* Strengths & Blind Spots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 glass rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <h4 className="font-bold text-foreground">Founder Strengths</h4>
                    </div>
                    <ul className="space-y-3">
                      {currentReadiness.readinessData.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                          <span className="text-sm text-foreground">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 glass rounded-3xl border border-rose-500/20 bg-rose-500/5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert className="h-5 w-5 text-rose-500" />
                      <h4 className="font-bold text-foreground">Critical Blind Spots</h4>
                    </div>
                    <div className="space-y-4">
                      {currentReadiness.readinessData.blindSpots.map((spot, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-sm font-bold text-foreground">{spot.issue}</p>
                          <p className="text-xs text-rose-500/80 leading-relaxed">Fix: {spot.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 90-Day Roadmap */}
                <div className="p-8 bg-card rounded-3xl border border-orange-500/30 shadow-xl shadow-orange-500/5">
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <RocketIcon className="h-5 w-5 text-orange-500" /> 90-Day Transition Roadmap
                  </h3>
                  
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {currentReadiness.readinessData.ninetyDayRoadmap.map((phase, i) => (
                      <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-orange-500 text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                          {i + 1}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-border bg-background shadow-sm">
                          <h4 className="font-bold text-foreground mb-2">{phase.phase}</h4>
                          <ul className="space-y-2">
                            {phase.actionItems.map((item, j) => (
                              <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="h-1 w-1 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-orange-500/30">
                <RocketIcon className="h-12 w-12 text-orange-500/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No founder analysis generated.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Enter your startup idea and risk profile to see if you have what it takes to launch.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
