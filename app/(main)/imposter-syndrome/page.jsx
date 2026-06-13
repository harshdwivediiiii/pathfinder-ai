"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, ShieldCheck, Loader2, Heart, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reframeThoughts, getImposterSyndromes } from "@/actions/imposter-syndrome";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ImposterSyndromePage() {
  const [doubts, setDoubts] = useState("");
  const [achievements, setAchievements] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentReframe, setCurrentReframe] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getImposterSyndromes();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentReframe(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!doubts.trim() || !achievements.trim()) {
      toast.error("Please fill out both your doubts and achievements.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await reframeThoughts(doubts, achievements);
      if (res.success) {
        toast.success("Cognitive reframing complete.");
        setDoubts("");
        setAchievements("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to generate reframes");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <Brain className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Imposter Syndrome Coach</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Rewrite the <span className="text-gradient-primary">Narrative.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Feeling like a fraud? It happens to the best of us. Tell us what your inner critic is saying, and we'll use cognitive reframing to help you see the objective reality of your success.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Let's unpack this.</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-red-500 flex items-center gap-1.5">
                  <Brain className="h-3 w-3" /> What is the inner critic saying?
                </label>
                <Textarea
                  placeholder="E.g., I only got this promotion because they had no one else. I don't actually know what I'm doing and they'll find out soon..."
                  value={doubts}
                  onChange={(e) => setDoubts(e.target.value)}
                  className="min-h-[120px] resize-none bg-background/50 border-red-500/20 rounded-2xl focus:border-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> What are the objective facts?
                </label>
                <Textarea
                  placeholder="E.g., I have 5 years of experience, I delivered the Q3 project on time, and my last review said I was a strong performer..."
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="min-h-[120px] resize-none bg-background/50 border-emerald-500/20 rounded-2xl focus:border-emerald-500"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  List raw facts. Don't worry if you don't fully believe them right now.
                </p>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !doubts.trim() || !achievements.trim()}
                className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reframing...
                  </>
                ) : (
                  <>
                    Reframe My Thoughts
                    <Heart className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Reframes</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentReframe(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentReframe?.id === item.id 
                        ? "bg-rose-500/10 border border-rose-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className={`h-4 w-4 shrink-0 ${currentReframe?.id === item.id ? "text-rose-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">Reframing Exercise</p>
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
            {currentReframe ? (
              <motion.div
                key={currentReframe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Empathy Statement */}
                <div className="p-6 glass rounded-3xl border border-rose-500/30 bg-rose-500/5">
                  <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4" /> Validation
                  </h3>
                  <p className="text-base text-foreground leading-relaxed italic">
                    "{currentReframe.reframeData.empathyStatement}"
                  </p>
                </div>

                {/* Cognitive Reframes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    Cognitive Reframing
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {currentReframe.reframeData.cognitiveReframes.map((reframe, idx) => (
                      <div key={idx} className="p-5 glass rounded-2xl border border-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-emerald-500" />
                        <div className="pl-3 space-y-4">
                          <div>
                            <p className="text-xs font-bold uppercase text-red-500 mb-1">The Doubt</p>
                            <p className="text-sm text-muted-foreground italic">"{reframe.theDoubt}"</p>
                          </div>
                          <div className="pt-3 border-t border-border">
                            <p className="text-xs font-bold uppercase text-emerald-500 mb-1">The Reality</p>
                            <p className="text-sm text-foreground font-medium">{reframe.theReality}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Advice & Mantra */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 glass rounded-3xl border border-amber-500/30 bg-amber-500/5">
                    <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-3 uppercase tracking-wide">
                      <Sparkles className="h-4 w-4" />
                      Your Power Mantra
                    </h3>
                    <p className="text-lg font-serif italic text-foreground leading-relaxed">
                      "{currentReframe.reframeData.powerMantra}"
                    </p>
                  </div>

                  <div className="p-6 glass rounded-3xl border border-blue-500/30 bg-blue-500/5">
                    <h3 className="text-sm font-bold text-blue-500 flex items-center gap-2 mb-3 uppercase tracking-wide">
                      <BookOpen className="h-4 w-4" />
                      Actionable Step
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {currentReframe.reframeData.actionableAdvice}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-rose-500/30">
                <Brain className="h-12 w-12 text-rose-500/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No thoughts reframed yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Enter your doubts and facts to generate a personalized cognitive reframing exercise.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
