"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Send, CheckCircle2, FileText, Loader2, CalendarHeart, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { planCareerBreak, getCareerBreakPlans } from "@/actions/career-break";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CareerBreakPage() {
  const [duration, setDuration] = useState("");
  const [reason, setReason] = useState("");
  const [returnGoals, setReturnGoals] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getCareerBreakPlans();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentPlan(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!duration.trim() || !reason.trim() || !returnGoals.trim()) {
      toast.error("Please fill out all fields to get a complete plan.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await planCareerBreak(duration, reason, returnGoals);
      if (res.success) {
        toast.success("Sabbatical plan generated successfully!");
        setDuration("");
        setReason("");
        setReturnGoals("");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500">
          <CalendarHeart className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Sabbatical Planner</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Pause Gracefully, <span className="text-gradient-primary">Return Strong.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Whether you're taking time off for family, health, or travel, we'll help you plan a graceful exit, stay relevant during your break, and explain the gap confidently when you return.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Plan Your Break</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Planned Duration</label>
                <Input
                  placeholder="E.g., 6 months, 1 year, undetermined..."
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Reason for Break</label>
                <Textarea
                  placeholder="E.g., Taking care of a newborn, traveling South America, burnout recovery..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Return Goals</label>
                <Textarea
                  placeholder="E.g., Return to a Senior Developer role, pivot into Product Management..."
                  value={returnGoals}
                  onChange={(e) => setReturnGoals(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !duration.trim() || !reason.trim() || !returnGoals.trim()}
                className="w-full h-12 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Planning...
                  </>
                ) : (
                  <>
                    Generate Plan
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
                        ? "bg-violet-500/10 border border-violet-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CalendarHeart className={`h-4 w-4 shrink-0 ${currentPlan?.id === item.id ? "text-violet-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.duration} Break</p>
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
                {/* Wording Strategy */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 glass rounded-3xl border border-violet-500/30 bg-violet-500/5 relative">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-violet-500">
                      <PenTool className="h-5 w-5" />
                      Resume Explanation
                    </h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed italic border-l-2 border-violet-500 pl-4">
                      "{currentPlan.planData.resumeExplanation}"
                    </p>
                    <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentPlan.planData.resumeExplanation)}>
                      Copy for Resume
                    </Button>
                  </div>
                  
                  <div className="p-6 glass rounded-3xl border border-[#0A66C2]/30 bg-[#0A66C2]/5 relative">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-[#0A66C2]">
                      <FileText className="h-5 w-5" />
                      LinkedIn Headline / Summary
                    </h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed italic border-l-2 border-[#0A66C2] pl-4">
                      "{currentPlan.planData.linkedinHeadline}"
                    </p>
                    <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentPlan.planData.linkedinHeadline)}>
                      Copy for LinkedIn
                    </Button>
                  </div>
                </div>

                {/* Interview Script */}
                <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                  <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2 mb-4">
                    <Coffee className="h-5 w-5" />
                    The Interview Script
                  </h3>
                  <div className="bg-background/60 p-4 rounded-2xl border border-emerald-500/20">
                    <p className="text-xs font-bold uppercase text-emerald-500 mb-2">When they ask about the gap:</p>
                    <p className="text-sm text-foreground italic">"{currentPlan.planData.interviewScript}"</p>
                  </div>
                </div>

                {/* Handoff & Staying Relevant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 glass rounded-3xl border border-border">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      Handoff Plan
                    </h3>
                    <ul className="space-y-3">
                      {currentPlan.planData.handoffPlan.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-amber-500 mt-1 font-bold">•</span>
                          <span className="text-sm text-foreground leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 glass rounded-3xl border border-border">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      Staying Relevant
                    </h3>
                    <ul className="space-y-3">
                      {currentPlan.planData.stayingRelevant.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-blue-500 mt-1 font-bold">•</span>
                          <span className="text-sm text-foreground leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <CalendarHeart className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No plans generated.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Fill out the form to confidently plan your sabbatical and future return.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
