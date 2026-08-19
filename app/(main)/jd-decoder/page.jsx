"use client";

import { useState } from "react";
import { decodeJobDescription } from "@/actions/jd-decoder";
import { SearchCode, AlertTriangle, ShieldCheck, Flag, Sparkles, MessagesSquare, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/misc/utils";

export default function JDDecoderPage() {
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);

  const handleDecode = async (e) => {
    e.preventDefault();
    if (jobDescription.length < 50) return;
    
    setLoading(true);
    setResult(null);

    const res = await decodeJobDescription(jobDescription);
    if (res.success) {
      setResult(res.data);
      toast.success("Job Description Decoded!");
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to decode JD");
    }
    
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score < 30) return "text-emerald-500";
    if (score < 70) return "text-amber-500";
    return "text-destructive";
  };

  const getScoreBg = (score) => {
    if (score < 30) return "bg-emerald-500/10 border-emerald-500/20";
    if (score < 70) return "bg-amber-500/10 border-amber-500/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const getScoreText = (score) => {
    if (score < 30) return "Low Risk (Healthy)";
    if (score < 70) return "Medium Risk (Proceed with caution)";
    return "High Risk (Highly Toxic)";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-[0.2em]">
              <SearchCode className="h-3 w-3" />
              JD Decoder
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Red Flag <span className="text-destructive">Detector</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl">
              Paste a job description to translate corporate jargon, uncover hidden red flags, and get the *actual* requirements before you apply.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Job Description</h3>
              
              <form onSubmit={handleDecode} className="space-y-5">
                <Textarea
                  placeholder="Paste the full job description here..."
                  className="min-h-[400px] rounded-xl resize-none bg-background focus-visible:ring-destructive text-sm leading-relaxed"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  disabled={loading || jobDescription.length < 50}
                  className="w-full h-12 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                >
                  {loading ? "Analyzing text..." : "Decode Job Description"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  {/* Score & Verdict Card */}
                  <div className={cn("p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6", getScoreBg(result.score))}>
                    <div className="text-center shrink-0">
                      <div className={cn("text-5xl font-black tabular-nums", getScoreColor(result.score))}>
                        {result.score}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">
                        Toxicity Score
                      </div>
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                      <h3 className={cn("text-xl font-bold", getScoreColor(result.score))}>
                        {getScoreText(result.score)}
                      </h3>
                      <p className="text-sm font-medium leading-relaxed opacity-90">
                        {result.verdict}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Red Flags */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <h3 className="font-bold text-lg">Red Flags</h3>
                      </div>
                      {result.redFlags?.length > 0 ? (
                        <div className="space-y-4">
                          {result.redFlags.map((flag, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="inline-flex bg-destructive/10 text-destructive px-2 py-0.5 rounded text-xs font-bold font-mono">
                                "{flag.phrase}"
                              </div>
                              <p className="text-sm text-muted-foreground">{flag.meaning}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No obvious red flags detected.</p>
                      )}
                    </div>

                    {/* Green Flags */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-bold text-lg">Green Flags</h3>
                      </div>
                      {result.greenFlags?.length > 0 ? (
                        <div className="space-y-4">
                          {result.greenFlags.map((flag, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="inline-flex bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-xs font-bold font-mono">
                                "{flag.phrase}"
                              </div>
                              <p className="text-sm text-muted-foreground">{flag.meaning}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No obvious green flags detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Jargon Translation */}
                  {result.jargonTranslation?.length > 0 && (
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <MessagesSquare className="h-5 w-5 text-blue-500" />
                        <h3 className="font-bold text-lg">Jargon Translator</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.jargonTranslation.map((jargon, idx) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-xl border border-border/50">
                            <span className="text-xs font-bold text-foreground block mb-1">They said:</span>
                            <span className="text-sm italic block mb-2">"{jargon.jargon}"</span>
                            <span className="text-xs font-bold text-blue-500 block mb-1">They mean:</span>
                            <span className="text-sm block">{jargon.translation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real Requirements */}
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-purple-500" />
                      <h3 className="font-bold text-lg">The "Real" Requirements</h3>
                    </div>
                    <ul className="list-disc pl-5 space-y-2">
                      {result.realRequirements?.map((req, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                </motion.div>
              ) : (
                <div key="empty" className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                  <div className="max-w-md space-y-4">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Flag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">No Analysis Yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Paste a job description on the left to reveal hidden red flags, decode corporate jargon, and estimate toxicity risk.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
