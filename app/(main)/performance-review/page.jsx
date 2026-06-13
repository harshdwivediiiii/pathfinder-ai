"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Send, FileText, Loader2, Trophy, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateSelfAssessment, getPerformanceReviews } from "@/actions/performance-review";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PerformanceReviewPage() {
  const [achievements, setAchievements] = useState("");
  const [challenges, setChallenges] = useState("");
  const [goals, setGoals] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentReview, setCurrentReview] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getPerformanceReviews();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentReview(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!achievements.trim() || !goals.trim()) {
      toast.error("Please fill out your achievements and goals.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateSelfAssessment(achievements, challenges, goals);
      if (res.success) {
        toast.success("Self-assessment drafted!");
        setAchievements("");
        setChallenges("");
        setGoals("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to draft assessment");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
          <LineChart className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Performance Review Writer</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Ace Your <span className="text-gradient-primary">Review.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Blank-page anxiety during review season? Dump your raw achievements and challenges here, and we'll draft a highly professional, metrics-driven self-assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">The Raw Details</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-1.5">
                  <Trophy className="h-3 w-3" /> Key Achievements (This Cycle)
                </label>
                <Textarea
                  placeholder="E.g., Shipped the new billing API 2 weeks early, reducing customer churn by 5%..."
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-emerald-500/20 rounded-2xl focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-amber-500 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> Challenges Faced (Optional)
                </label>
                <Textarea
                  placeholder="E.g., We lost a senior engineer mid-project so I had to step up and learn Kubernetes fast..."
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-amber-500/20 rounded-2xl focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-indigo-500 flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Goals for Next Cycle
                </label>
                <Textarea
                  placeholder="E.g., I want to lead the mobile app rebuild and mentor 2 junior devs..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-indigo-500/20 rounded-2xl focus:border-indigo-500"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !achievements.trim() || !goals.trim()}
                className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold mt-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Drafting Assessment...
                  </>
                ) : (
                  <>
                    Write My Review
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Reviews</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentReview(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentReview?.id === item.id 
                        ? "bg-blue-500/10 border border-blue-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`h-4 w-4 shrink-0 ${currentReview?.id === item.id ? "text-blue-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">Self-Assessment Draft</p>
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
            {currentReview ? (
              <motion.div
                key={currentReview.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Executive Summary */}
                <div className="p-6 glass rounded-3xl border border-blue-500/30 bg-blue-500/5">
                  <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3">Executive Summary</h3>
                  <p className="text-base text-foreground leading-relaxed italic">
                    "{currentReview.reviewData.executiveSummary}"
                  </p>
                  <Button size="sm" variant="secondary" className="mt-4 rounded-xl text-xs" onClick={() => copyToClipboard(currentReview.reviewData.executiveSummary)}>
                    Copy Summary
                  </Button>
                </div>

                {/* Key Achievements */}
                <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                  <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5" />
                    Key Achievements
                  </h3>
                  <div className="space-y-5">
                    {currentReview.reviewData.keyAchievements.map((ach, idx) => (
                      <div key={idx} className="relative pl-5 border-l-2 border-emerald-500/20">
                        <div className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full -left-[6px] top-1.5" />
                        <h4 className="text-sm font-bold text-foreground">{ach.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{ach.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenges & Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 glass rounded-3xl border border-amber-500/30 bg-amber-500/5">
                    <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-3 uppercase tracking-wide">
                      <AlertTriangle className="h-4 w-4" />
                      Challenges Re-framed
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {currentReview.reviewData.growthAndChallenges}
                    </p>
                  </div>

                  <div className="p-6 glass rounded-3xl border border-indigo-500/30 bg-indigo-500/5">
                    <h3 className="text-sm font-bold text-indigo-500 flex items-center gap-2 mb-3 uppercase tracking-wide">
                      <Target className="h-4 w-4" />
                      Future Goals
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {currentReview.reviewData.futureGoals}
                    </p>
                  </div>
                </div>

                {/* Manager 1-on-1 Prep */}
                <div className="p-6 glass rounded-3xl border border-border relative bg-background/40">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-foreground">
                    <FileText className="h-5 w-5 text-violet-500" />
                    Manager 1-on-1 Talking Points
                  </h3>
                  <ul className="space-y-2">
                    {currentReview.reviewData.managerTalkingPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-violet-500 mt-1 font-bold">•</span>
                        <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-blue-500/30">
                <LineChart className="h-12 w-12 text-blue-500/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No reviews drafted yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Dump your raw notes on the left, and we will turn them into a polished self-assessment.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
