"use client";

import { useState } from "react";
import { spinWeakness } from "@/actions/weakness-spinner";
import { 
  Sparkles, ShieldAlert, Zap, 
  Settings2, TrendingUp, Copy, CheckCircle2, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function WeaknessSpinnerPage() {
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [rawWeakness, setRawWeakness] = useState("");
  const [result, setResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!targetRole || rawWeakness.length < 5) return;
    
    setLoading(true);
    const res = await spinWeakness(targetRole, rawWeakness);
    
    if (res.success) {
      setResult(res.data);
      toast.success("Weakness successfully spun!");
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to spin weakness");
    }
    setLoading(false);
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderAngleCard = (title, icon, data, index, colorClass, bgClass, borderClass) => (
    <div className={`bg-card border ${borderClass} rounded-3xl p-6 shadow-sm relative group transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-full ${bgClass} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg leading-tight">{title}</h3>
        </div>
      </div>
      <div className={`p-5 ${bgClass} rounded-2xl border ${borderClass} relative`}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background"
          onClick={() => handleCopy(data.answer, index)}
        >
          {copiedIndex === index ? <CheckCircle2 className={`h-4 w-4 ${colorClass}`} /> : <Copy className="h-4 w-4" />}
        </Button>
        <p className="font-semibold text-foreground pr-8 text-base leading-relaxed">"{data.answer}"</p>
        <div className={`mt-4 pt-3 border-t ${borderClass}`}>
          <p className="text-sm text-muted-foreground">
            <span className={`font-bold ${colorClass}`}>Why it works:</span> {data.explanation}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] -z-10 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] -z-10 translate-x-1/3 translate-y-1/3" />
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4 mb-12"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-500 font-bold text-xs uppercase tracking-[0.2em] border border-rose-500/20">
            <RefreshCw className="h-4 w-4" />
            Interview Mastery
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            The Weakness <span className="text-rose-500">Spinner</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl">
            Never bomb the "What is your biggest weakness?" question again. Enter your brutal, honest weakness, and we'll spin it into a brilliant, authentic interview response.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
              
              <form onSubmit={handleGenerate} className="space-y-6 mt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Role</Label>
                  <Input
                    placeholder="e.g. Product Manager"
                    className="h-12 rounded-xl bg-background focus-visible:ring-rose-500"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-500" /> 
                    Your Real Weakness
                  </Label>
                  <Textarea
                    placeholder="Be brutally honest. e.g. I get bored easily and hate repetitive tasks, or I am terrified of public speaking..."
                    className="min-h-[150px] rounded-xl resize-none bg-background focus-visible:ring-rose-500 text-sm leading-relaxed"
                    value={rawWeakness}
                    onChange={(e) => setRawWeakness(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !targetRole || rawWeakness.length < 5}
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-lg shadow-rose-500/25 transition-all"
                >
                  {loading ? (
                    <>Spinning... <RefreshCw className="ml-2 h-4 w-4 animate-spin" /></>
                  ) : (
                    <>Spin My Weakness <Sparkles className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-sm font-medium text-foreground italic flex gap-3 items-center">
                    <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0" />
                    <span>{result.analysis}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {renderAngleCard(
                      "The System Builder Angle", 
                      <Settings2 className="h-5 w-5 text-blue-500" />, 
                      result.systemBuilder, 
                      'sys', 
                      'text-blue-500', 
                      'bg-blue-500/5', 
                      'border-blue-500/20'
                    )}
                    
                    {renderAngleCard(
                      "The Hidden Strength Angle", 
                      <Zap className="h-5 w-5 text-amber-500" />, 
                      result.hiddenStrength, 
                      'hid', 
                      'text-amber-600 dark:text-amber-500', 
                      'bg-amber-500/5', 
                      'border-amber-500/20'
                    )}
                    
                    {renderAngleCard(
                      "The Growth Story Angle", 
                      <TrendingUp className="h-5 w-5 text-emerald-500" />, 
                      result.growthStory, 
                      'gro', 
                      'text-emerald-600 dark:text-emerald-500', 
                      'bg-emerald-500/5', 
                      'border-emerald-500/20'
                    )}
                  </div>
                </motion.div>
              ) : (
                <div key="empty" className="h-full min-h-[500px] flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center bg-card/30">
                  <div className="max-w-md space-y-4">
                    <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="h-8 w-8 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold">Waiting for your weakness...</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Enter your target role and a brutally honest weakness on the left. We'll generate 3 brilliant, interview-ready ways to answer the hardest question.
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
