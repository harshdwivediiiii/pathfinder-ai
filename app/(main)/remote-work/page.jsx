"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Send, CheckCircle2, ShieldAlert, FileText, Loader2, MessageSquare, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateRemotePitch, getRemotePitches } from "@/actions/remote-work";
import { toast } from "sonner";
import { format } from "date-fns";

export default function RemoteWorkPage() {
  const [role, setRole] = useState("");
  const [reasons, setReasons] = useState("");
  const [objections, setObjections] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPitch, setCurrentPitch] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getRemotePitches();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentPitch(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!role.trim() || !reasons.trim()) {
      toast.error("Please provide your role and reasons.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateRemotePitch(role, reasons, objections);
      if (res.success) {
        toast.success("Remote work pitch generated successfully!");
        setRole("");
        setReasons("");
        setObjections("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to generate pitch");
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
          <Home className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Remote Work Negotiator</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Pitch Remote Work <span className="text-gradient-primary">Like a Pro.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Want to transition to remote work or a 4-day week? Tell us your role and reasons. We'll build a data-backed business case focused on company benefits, plus scripts to handle your manager's objections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Build Your Case</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Your Role</label>
                <Input
                  placeholder="E.g., Senior Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-12 bg-background/50 border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Why do you want this?</label>
                <Textarea
                  placeholder="E.g., I'm more productive without office distractions, commuting takes 2 hours..."
                  value={reasons}
                  onChange={(e) => setReasons(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Anticipated Objections (Optional)</label>
                <Textarea
                  placeholder="E.g., My manager thinks collaboration will suffer..."
                  value={objections}
                  onChange={(e) => setObjections(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !role.trim() || !reasons.trim()}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building Case...
                  </>
                ) : (
                  <>
                    Generate Pitch
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Pitches</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPitch(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentPitch?.id === item.id 
                        ? "bg-emerald-500/10 border border-emerald-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className={`h-4 w-4 shrink-0 ${currentPitch?.id === item.id ? "text-emerald-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.role}</p>
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
            {currentPitch ? (
              <motion.div
                key={currentPitch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Business Case */}
                <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                  <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5" />
                    The Business Case
                  </h3>
                  <ul className="space-y-3">
                    {currentPitch.pitchData.businessCase.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-emerald-500 mt-1 font-bold">{idx + 1}.</span>
                        <span className="text-sm text-foreground leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Counter Objections */}
                <div className="p-6 glass rounded-3xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4">
                    <ShieldAlert className="h-5 w-5" />
                    Handling Objections
                  </h3>
                  <div className="space-y-4">
                    {currentPitch.pitchData.counterObjections.map((obj, idx) => (
                      <div key={idx} className="p-4 bg-background/60 rounded-2xl border border-amber-500/20">
                        <p className="text-sm font-bold text-foreground mb-1"><span className="text-amber-500">Manager:</span> "{obj.objection}"</p>
                        <p className="text-sm text-muted-foreground"><span className="text-emerald-500 font-bold">You:</span> "{obj.rebuttal}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scripts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 glass rounded-3xl border border-border relative">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-violet-500" />
                      Written Proposal
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap italic">
                      "{currentPitch.pitchData.writtenProposal}"
                    </p>
                    <Button size="sm" variant="secondary" className="mt-4 w-full rounded-xl" onClick={() => copyToClipboard(currentPitch.pitchData.writtenProposal)}>
                      Copy Email
                    </Button>
                  </div>
                  
                  <div className="p-6 glass rounded-3xl border border-border relative">
                    <h3 className="text-base font-bold flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      1-on-1 Verbal Script
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap italic">
                      "{currentPitch.pitchData.verbalScript}"
                    </p>
                    <Button size="sm" variant="secondary" className="mt-4 w-full rounded-xl" onClick={() => copyToClipboard(currentPitch.pitchData.verbalScript)}>
                      Copy Script
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <Home className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No pitches yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Fill out the form to generate a compelling business case for remote work.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
