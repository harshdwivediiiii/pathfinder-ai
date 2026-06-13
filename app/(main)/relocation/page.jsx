"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Send, DollarSign, FileText, Loader2, Home, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzeRelocation, getRelocationAnalyses } from "@/actions/relocation";
import { toast } from "sonner";
import { format } from "date-fns";

export default function RelocationPage() {
  const [currentCity, setCurrentCity] = useState("");
  const [targetCity, setTargetCity] = useState("");
  const [salary, setSalary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getRelocationAnalyses();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentAnalysis(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!currentCity.trim() || !targetCity.trim() || !salary.trim()) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await analyzeRelocation(currentCity, targetCity, salary);
      if (res.success) {
        toast.success("Relocation analysis complete!");
        setCurrentCity("");
        setTargetCity("");
        setSalary("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to analyze relocation");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Relocation Analyzer</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Negotiate Your <span className="text-gradient-primary">Move.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Moving for a new job? Calculate the cost of living difference and generate the exact scripts needed to negotiate a relocation bonus or a COLA (Cost of Living Adjustment).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Relocation Details</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Current City</label>
                <Input
                  placeholder="E.g., Austin, TX"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Target City</label>
                <Input
                  placeholder="E.g., New York, NY"
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Offered Base Salary</label>
                <Input
                  placeholder="E.g., $120,000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !currentCity.trim() || !targetCity.trim() || !salary.trim()}
                className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Relocation
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
                    onClick={() => setCurrentAnalysis(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentAnalysis?.id === item.id 
                        ? "bg-orange-500/10 border border-orange-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Home className={`h-4 w-4 shrink-0 ${currentAnalysis?.id === item.id ? "text-orange-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.currentCity} → {item.targetCity}</p>
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
            {currentAnalysis ? (
              <motion.div
                key={currentAnalysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Cost of Living Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 glass rounded-3xl border border-orange-500/30 bg-orange-500/5">
                    <h3 className="text-sm font-bold text-orange-500 flex items-center gap-2 mb-2 uppercase tracking-wide">
                      <TrendingUp className="h-4 w-4" />
                      Cost Difference
                    </h3>
                    <p className="text-xl font-bold text-foreground">{currentAnalysis.analysisData.costOfLivingDelta}</p>
                  </div>

                  <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                    <h3 className="text-sm font-bold text-emerald-500 flex items-center gap-2 mb-2 uppercase tracking-wide">
                      <DollarSign className="h-4 w-4" />
                      Equivalent Salary Needed
                    </h3>
                    <p className="text-xl font-bold text-foreground">{currentAnalysis.analysisData.equivalentSalary}</p>
                  </div>
                </div>

                {/* Hidden Costs */}
                <div className="p-6 glass rounded-3xl border border-border">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-4">
                    <Receipt className="h-4 w-4 text-rose-500" />
                    Hidden Relocation Costs
                  </h3>
                  <ul className="space-y-3">
                    {currentAnalysis.analysisData.hiddenCosts.map((cost, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-rose-500 mt-1 font-bold">•</span>
                        <span className="text-sm text-foreground leading-relaxed">{cost}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Negotiation Scripts */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 glass rounded-3xl border border-border relative bg-background/40">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-foreground">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Relocation Bonus Script
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {currentAnalysis.analysisData.relocationBonusScript}
                    </p>
                    <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentAnalysis.analysisData.relocationBonusScript)}>
                      Copy Bonus Script
                    </Button>
                  </div>
                  
                  <div className="p-6 glass rounded-3xl border border-border relative bg-background/40">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-foreground">
                      <FileText className="h-5 w-5 text-violet-500" />
                      COLA (Base Salary) Script
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {currentAnalysis.analysisData.colaNegotiationScript}
                    </p>
                    <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentAnalysis.analysisData.colaNegotiationScript)}>
                      Copy Salary Script
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No analyses yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Compare your current city to your target destination to get negotiation data.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
