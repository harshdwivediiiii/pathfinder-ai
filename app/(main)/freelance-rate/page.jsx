"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Send, FileText, Loader2, Calculator, TrendingUp, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { calculateRate, getFreelanceRates } from "@/actions/freelance-rate";
import { toast } from "sonner";
import { format } from "date-fns";

export default function FreelanceRatePage() {
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [targetIncome, setTargetIncome] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getFreelanceRates();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentRate(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!skills.trim() || !experience.trim() || !targetIncome.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await calculateRate(skills, experience, targetIncome);
      if (res.success) {
        toast.success("Rate calculation complete!");
        setSkills("");
        setExperience("");
        setTargetIncome("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to calculate rate");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <DollarSign className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Freelance Rate Calculator</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Know Your <span className="text-gradient-primary">Worth.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Going independent? Calculate your optimal hourly or project-based rate, and get the exact scripts you need to justify your pricing to clients who push back.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Your Details</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Core Skills / Services</label>
                <Textarea
                  placeholder="E.g., Full-stack development, React, Node.js, UI/UX consulting..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Experience Level</label>
                <Input
                  placeholder="E.g., 5 years, Senior level"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Annual Target Income (Gross)</label>
                <Input
                  placeholder="E.g., $150,000"
                  value={targetIncome}
                  onChange={(e) => setTargetIncome(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !skills.trim() || !experience.trim() || !targetIncome.trim()}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crunching Numbers...
                  </>
                ) : (
                  <>
                    Calculate My Rate
                    <Calculator className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Calculations</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentRate(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentRate?.id === item.id 
                        ? "bg-emerald-500/10 border border-emerald-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <HandCoins className={`h-4 w-4 shrink-0 ${currentRate?.id === item.id ? "text-emerald-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">Target: {item.targetIncome}</p>
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
            {currentRate ? (
              <motion.div
                key={currentRate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* The Rate */}
                <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5 text-center">
                  <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-2">
                    Recommended Hourly Rate
                  </h3>
                  <p className="text-5xl font-black text-foreground">{currentRate.rateData.calculatedHourlyRate}</p>
                </div>

                {/* Justification */}
                <div className="p-6 glass rounded-3xl border border-border">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    Why this rate?
                  </h3>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-indigo-500/30 pl-4">
                    {currentRate.rateData.rateJustification}
                  </div>
                </div>

                {/* Project Pricing */}
                <div className="p-6 glass rounded-3xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-3">
                    <Calculator className="h-5 w-5" />
                    Fixed-Project Pricing Strategy
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {currentRate.rateData.projectPricingAdvice}
                  </p>
                </div>

                {/* Pushback Scripts */}
                <div className="p-6 glass rounded-3xl border border-border relative bg-background/40">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-6 text-foreground">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Objection Handling Scripts
                  </h3>
                  <div className="space-y-6">
                    {currentRate.rateData.pushbackScripts.map((script, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-xs font-bold uppercase text-red-500">Client: "{script.objection}"</p>
                        <div className="flex flex-col items-start gap-2">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap italic border-l-2 border-blue-500/30 pl-3">
                            "{script.script}"
                          </p>
                          <Button size="sm" variant="secondary" className="h-7 text-xs rounded-lg mt-1" onClick={() => copyToClipboard(script.script)}>
                            Copy Response
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No calculations yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Enter your skills and income goals to discover your true market value.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
