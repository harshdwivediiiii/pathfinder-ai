"use client";

import { useState } from "react";
import { translateToCorporate } from "@/actions/translator";
import { 
  MessagesSquare, Sparkles, Copy, 
  CheckCircle2, RefreshCw, Handshake
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function TranslatorPage() {
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");
  const [tone, setTone] = useState("Polite & Helpful");
  const [result, setResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const TONES = [
    { value: "Firm Boundary", icon: "🛡️", desc: "Professional but strict" },
    { value: "Polite & Helpful", icon: "🤝", desc: "Collaborative and kind" },
    { value: "Managerial", icon: "👔", desc: "Process-oriented" },
    { value: "Passive Aggressive", icon: "🌶️", desc: "As per my last email" }
  ];

  const handleTranslate = async (e) => {
    e.preventDefault();
    if (rawText.length < 5) return;
    
    setLoading(true);
    const res = await translateToCorporate(rawText, tone);
    
    if (res.success) {
      setResult(res.data);
      toast.success("Message translated successfully!");
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to translate message");
    }
    setLoading(false);
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10 translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4 mb-12"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs uppercase tracking-[0.2em] border border-blue-500/20">
            <Handshake className="h-4 w-4" />
            AI Diplomat
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            The Corporate <span className="text-blue-500">Translator</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl">
            Drafted an angry Slack message? Don't send it. Type what you *want* to say below, and the AI will translate it into perfect, HR-friendly corporate speak.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Side */}
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative">
              <form onSubmit={handleTranslate} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What you want to say</Label>
                  <Textarea
                    placeholder="E.g. I already told you this yesterday, please just read my previous email..."
                    className="min-h-[150px] rounded-2xl resize-none bg-background focus-visible:ring-blue-500 text-base p-4 leading-relaxed border-border/50"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Desired Tone</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTone(t.value)}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          tone === t.value 
                            ? "bg-blue-500/10 border-blue-500/30 shadow-sm" 
                            : "bg-background border-border/50 hover:border-border"
                        }`}
                      >
                        <span className="text-sm font-bold flex items-center gap-2">
                          <span>{t.icon}</span> {t.value}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || rawText.length < 5}
                  className="w-full h-12 rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all"
                >
                  {loading ? (
                    <>Translating... <RefreshCw className="ml-2 h-4 w-4 animate-spin" /></>
                  ) : (
                    <>Translate to Corporate <Sparkles className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Output Side */}
          <div className="h-full min-h-[400px]">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-sm font-medium text-foreground italic flex gap-3 items-start">
                    <MessagesSquare className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <span>{result.analysis}</span>
                  </div>

                  <div className="space-y-4">
                    {result.translations.map((item, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative group transition-all hover:border-blue-500/30 hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Option {idx + 1}: {item.variation}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                            onClick={() => handleCopy(item.text, idx)}
                          >
                            {copiedIndex === idx ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        <p className="text-foreground text-base leading-relaxed mb-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                          {item.text}
                        </p>
                        
                        <div className="flex gap-2 items-start mt-2 border-t border-border/50 pt-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Why it works:</span> {item.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div key="empty" className="h-full flex items-center justify-center p-8 border-2 border-dashed border-border rounded-3xl text-center bg-card/50">
                  <div className="max-w-sm space-y-4">
                    <div className="h-16 w-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessagesSquare className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold">Waiting for input...</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Type your raw message on the left and select a tone. The AI will provide 3 HR-approved ways to say it safely.
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
