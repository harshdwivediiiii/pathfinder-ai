"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Send, CheckCircle2, FileText, Loader2, Target, CalendarDays, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateMentorPlan, getMentorOutreaches } from "@/actions/mentor";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MentorMatcherPage() {
  const [goals, setGoals] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getMentorOutreaches();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentPlan(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!goals.trim() || !targetIndustry.trim()) {
      toast.error("Please fill out your goals and target industry.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateMentorPlan(goals, targetIndustry);
      if (res.success) {
        toast.success("Mentor strategy generated successfully!");
        setGoals("");
        setTargetIndustry("");
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
          <Users className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Mentor Matcher</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Find Your <span className="text-gradient-primary">Career Guide.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stop asking "Will you be my mentor?" We'll help you identify exactly who to look for, write the perfect cold outreach message, and structure a 6-month agenda for your 1-on-1s.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">What do you need help with?</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Target Industry / Role</label>
                <Input
                  placeholder="E.g., B2B SaaS Product Management"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Your Specific Goals</label>
                <Textarea
                  placeholder="E.g., I want to transition from marketing to PM, and I need help understanding technical trade-offs and stakeholder management..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !goals.trim() || !targetIndustry.trim()}
                className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Mentors...
                  </>
                ) : (
                  <>
                    Generate Mentor Strategy
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
                        ? "bg-cyan-500/10 border border-cyan-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Target className={`h-4 w-4 shrink-0 ${currentPlan?.id === item.id ? "text-cyan-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.targetIndustry}</p>
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
                {/* The Archetype */}
                <div className="p-6 glass rounded-3xl border border-cyan-500/30 bg-cyan-500/5">
                  <h3 className="text-lg font-bold text-cyan-500 flex items-center gap-2 mb-3">
                    <Search className="h-5 w-5" />
                    Who to Look For
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {currentPlan.outreachData.mentorArchetype}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-cyan-500/20">
                    <p className="text-xs font-bold uppercase text-cyan-500 mb-2">Where to find them:</p>
                    <ul className="space-y-2">
                      {currentPlan.outreachData.whereToFindThem.map((place, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="text-cyan-500">•</span> {place}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Outreach Message */}
                <div className="p-6 glass rounded-3xl border border-border relative bg-background/40">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-foreground">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Cold Outreach Message
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed italic border-l-2 border-blue-500 pl-4">
                    "{currentPlan.outreachData.outreachMessage}"
                  </p>
                  <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentPlan.outreachData.outreachMessage)}>
                    Copy Message
                  </Button>
                </div>

                {/* 6-Month Agenda */}
                <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                  <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2 mb-6">
                    <CalendarDays className="h-5 w-5" />
                    6-Month 1-on-1 Agenda
                  </h3>
                  <div className="space-y-6">
                    {currentPlan.outreachData.sixMonthAgenda.map((month, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-emerald-500/20">
                        <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1" />
                        <h4 className="text-sm font-bold text-foreground mb-1">{month.month}: {month.topic}</h4>
                        <div className="space-y-1">
                          {month.questionsToAsk.map((q, qIdx) => (
                            <p key={qIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-emerald-500/50 mt-0.5">↳</span> {q}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No strategies yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Enter your goals to find the perfect mentor archetype and outreach strategy.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
