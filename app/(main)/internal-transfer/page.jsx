"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, Send, CheckCircle2, ShieldAlert, FileText, Loader2, Workflow, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateTransferStrategy, getInternalTransfers } from "@/actions/internal-transfer";
import { toast } from "sonner";
import { format } from "date-fns";

export default function InternalTransferPage() {
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [reasons, setReasons] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentStrategy, setCurrentStrategy] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getInternalTransfers();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentStrategy(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!currentRole.trim() || !targetRole.trim() || !reasons.trim()) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateTransferStrategy(currentRole, targetRole, reasons);
      if (res.success) {
        toast.success("Transfer strategy generated successfully!");
        setCurrentRole("");
        setTargetRole("");
        setReasons("");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
          <Workflow className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Internal Mobility</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Nail Your <span className="text-gradient-primary">Internal Transfer.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Moving teams is a delicate dance. We'll help you pitch the new hiring manager and gracefully break the news to your current manager without burning bridges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Build Your Transfer Strategy</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Current Role & Team</label>
                <Input
                  placeholder="E.g., Customer Success Manager"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Target Role & Team</label>
                <Input
                  placeholder="E.g., Product Manager, Growth Team"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Why do you want to transfer?</label>
                <Textarea
                  placeholder="E.g., I want to be closer to product development and use my technical skills..."
                  value={reasons}
                  onChange={(e) => setReasons(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !currentRole.trim() || !targetRole.trim() || !reasons.trim()}
                className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Strategizing...
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
                    onClick={() => setCurrentStrategy(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentStrategy?.id === item.id 
                        ? "bg-blue-500/10 border border-blue-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ArrowRightLeft className={`h-4 w-4 shrink-0 ${currentStrategy?.id === item.id ? "text-blue-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">To {item.targetRole}</p>
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
                {/* Scripts */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 glass rounded-3xl border border-blue-500/30 bg-blue-500/5 relative">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-3 text-blue-500">
                      <FileText className="h-5 w-5" />
                      Pitch: New Hiring Manager
                    </h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {currentStrategy.transferData.newManagerPitch}
                    </p>
                    <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentStrategy.transferData.newManagerPitch)}>
                      Copy Pitch
                    </Button>
                  </div>
                  
                  <div className="p-6 glass rounded-3xl border border-rose-500/30 bg-rose-500/5 relative">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-3 text-rose-500">
                      <MessageCircle className="h-5 w-5" />
                      Script: Current Manager
                    </h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {currentStrategy.transferData.currentManagerScript}
                    </p>
                    <Button size="sm" variant="secondary" className="mt-4 rounded-xl" onClick={() => copyToClipboard(currentStrategy.transferData.currentManagerScript)}>
                      Copy Script
                    </Button>
                  </div>
                </div>

                {/* Transition Plan */}
                <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                  <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5" />
                    Step-by-Step Transition Plan
                  </h3>
                  <div className="space-y-4">
                    {currentStrategy.transferData.transitionPlan.map((step, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-foreground mt-1.5 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                <div className="p-6 glass rounded-3xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4">
                    <ShieldAlert className="h-5 w-5" />
                    Potential Risks to Navigate
                  </h3>
                  <ul className="space-y-3">
                    {currentStrategy.transferData.potentialRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-amber-500 mt-1 font-bold">•</span>
                        <span className="text-sm text-foreground leading-relaxed">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <Workflow className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No strategies generated.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Fill out the form to plan your internal mobility strategy safely.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
