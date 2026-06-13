"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Send, ArrowRight, Loader2, CheckCircle2, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateLayoffStrategy, getLayoffStrategies } from "@/actions/layoff";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LayoffStrategistPage() {
  const [details, setDetails] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getLayoffStrategies();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentPlan(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!details.trim()) {
      toast.error("Please provide your layoff/severance details.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateLayoffStrategy(details);
      if (res.success) {
        toast.success("Strategy generated successfully");
        setDetails("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to generate strategy");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-4xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
          <ShieldAlert className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Layoff Strategist</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Bounce Back <span className="text-gradient-primary">Stronger.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Input your severance details or layoff situation. The AI will decode your package, tell you what to negotiate, and build a 30-day recovery plan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Your Situation</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Details & Severance Offer</label>
                <Textarea
                  placeholder="e.g. I was laid off today. They offered 4 weeks of severance and 1 month of COBRA. I had unvested RSUs..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="min-h-[200px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !details.trim()}
                className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Package...
                  </>
                ) : (
                  <>
                    Generate Strategy
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Strategies</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPlan(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentPlan?.id === item.id 
                        ? "bg-blue-500/10 border border-blue-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`h-4 w-4 ${currentPlan?.id === item.id ? "text-blue-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{item.details}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {currentPlan ? (
              <motion.div
                key={currentPlan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 glass rounded-3xl border border-blue-500/30 bg-blue-500/5">
                  <h3 className="text-xl font-bold text-blue-500 flex items-center gap-2 mb-3">
                    <ShieldAlert className="h-5 w-5" />
                    Situation Analysis
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">{currentPlan.planContent.empatheticSummary}</p>
                </div>

                <div className="p-6 glass rounded-3xl border border-border">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5 text-amber-500" />
                    What to Negotiate / Ask HR
                  </h3>
                  <ul className="space-y-3">
                    {currentPlan.planContent.negotiationPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 glass rounded-3xl border border-border">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                    <ArrowRight className="h-5 w-5 text-emerald-500" />
                    30-Day Bounce-Back Plan
                  </h3>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {currentPlan.planContent.bounceBackPlan.map((step, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-background bg-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl glass border border-border/50 hover:border-emerald-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                              {step.timeframe}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No plan generated yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Enter your situation on the left to get a personalized strategy.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
