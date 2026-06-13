"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Send, CheckCircle2, FileText, Loader2, Plane, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateVisaStrategy, getVisaStrategies } from "@/actions/visa";
import { toast } from "sonner";
import { format } from "date-fns";

export default function VisaGuidePage() {
  const [visaType, setVisaType] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [concerns, setConcerns] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentStrategy, setCurrentStrategy] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getVisaStrategies();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentStrategy(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!visaType.trim() || !targetRole.trim()) {
      toast.error("Please fill out your visa type and target role.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateVisaStrategy(visaType, targetRole, concerns);
      if (res.success) {
        toast.success("Visa strategy generated successfully!");
        setVisaType("");
        setTargetRole("");
        setConcerns("");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Visa & Immigration Guide</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Navigate Sponsorship <span className="text-gradient-primary">Safely.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Need an H-1B, OPT, or O-1? We'll help you craft the perfect cover letter clause, a strategic timeline, and tactful email scripts to discuss sponsorship with HR without getting disqualified early.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Your Situation</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Current/Target Visa Type</label>
                <Input
                  placeholder="E.g., F-1 OPT (Stem), H-1B, TN..."
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Target Role</label>
                <Input
                  placeholder="E.g., Senior Data Scientist"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Specific Concerns (Optional)</label>
                <Textarea
                  placeholder="E.g., My OPT expires in 6 months, companies are filtering out international students..."
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !visaType.trim() || !targetRole.trim()}
                className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Strategizing...
                  </>
                ) : (
                  <>
                    Generate Visa Strategy
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
                    onClick={() => setCurrentStrategy(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentStrategy?.id === item.id 
                        ? "bg-indigo-500/10 border border-indigo-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Plane className={`h-4 w-4 shrink-0 ${currentStrategy?.id === item.id ? "text-indigo-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.visaType}</p>
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
            {currentStrategy ? (
              <motion.div
                key={currentStrategy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Timeline */}
                <div className="p-6 glass rounded-3xl border border-indigo-500/30 bg-indigo-500/5">
                  <h3 className="text-lg font-bold text-indigo-500 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5" />
                    Strategic Timeline
                  </h3>
                  <div className="space-y-4">
                    {currentStrategy.strategyData.strategicTimeline.map((step, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-foreground mt-1.5 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cover Letter Clause */}
                <div className="p-6 glass rounded-3xl border border-border relative bg-background/40">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-foreground">
                    <FileText className="h-5 w-5 text-violet-500" />
                    Cover Letter Clause
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed italic">
                    "{currentStrategy.strategyData.coverLetterClause}"
                  </p>
                  <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentStrategy.strategyData.coverLetterClause)}>
                    Copy Clause
                  </Button>
                </div>

                {/* Email Script */}
                <div className="p-6 glass rounded-3xl border border-border relative bg-background/40">
                  <h3 className="text-base font-bold flex items-center gap-2 mb-3 text-foreground">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Email to HR / Recruiter
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {currentStrategy.strategyData.hrEmailScript}
                  </p>
                  <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentStrategy.strategyData.hrEmailScript)}>
                    Copy Email
                  </Button>
                </div>

                {/* Interview Talking Points */}
                <div className="p-6 glass rounded-3xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5" />
                    Interview Talking Points
                  </h3>
                  <ul className="space-y-3">
                    {currentStrategy.strategyData.interviewTalkingPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-amber-500 mt-1 font-bold">•</span>
                        <span className="text-sm text-foreground leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No strategies generated.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Fill out the form to safely navigate your visa sponsorship process.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
