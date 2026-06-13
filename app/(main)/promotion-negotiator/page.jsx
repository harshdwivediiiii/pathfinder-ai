"use client";

import { useState, useEffect } from "react";
import { generatePromotionStrategy, getPromotionStrategies } from "@/actions/promotion";
import { TrendingUp, Sparkles, Award, Target, MessageCircle, Copy, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function PromotionNegotiatorPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState(null);
  
  const [formData, setFormData] = useState({
    targetRole: "",
    achievements: ""
  });

  useEffect(() => {
    async function loadHistory() {
      const res = await getPromotionStrategies();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveStrategy(res.data[0]);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generatePromotionStrategy(formData.achievements, formData.targetRole);
    if (res.success) {
      toast.success("Promotion strategy generated!");
      setHistory([res.data, ...history]);
      setActiveStrategy(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate strategy");
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-500 font-bold text-xs uppercase tracking-[0.2em]">
              <TrendingUp className="h-3 w-3" />
              Internal Growth
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Promotion <span className="text-purple-500">Negotiator</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Build a bulletproof "Brag Document" and get the script to ask your boss for a raise.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" /> Your Value Proposition
              </h3>
              
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" /> Target Role / Title
                  </label>
                  <Input
                    placeholder="e.g. Senior Frontend Engineer"
                    className="h-12 rounded-xl bg-background focus-visible:ring-purple-500"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" /> Major Achievements (Last 12 Months)
                  </label>
                  <Textarea
                    placeholder="e.g. Led the migration to Next.js which improved page load by 40%. Mentored 2 junior devs. Shipped the billing dashboard 2 weeks early."
                    className="min-h-[200px] rounded-xl resize-none bg-background focus-visible:ring-purple-500 text-sm leading-relaxed"
                    value={formData.achievements}
                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.targetRole || formData.achievements.length < 20}
                  className="w-full h-12 rounded-xl font-bold bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20 mt-4"
                >
                  {loading ? "Strategizing..." : "Generate Pitch"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeStrategy ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* ROI Summary */}
                <div className="bg-purple-500 text-white p-6 md:p-8 rounded-3xl shadow-xl">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-purple-200 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> The ROI You Bring
                  </h3>
                  <p className="text-lg font-medium leading-relaxed">
                    "{activeStrategy.content.roiAnalysis}"
                  </p>
                </div>

                {/* Brag Document */}
                <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-500" /> The Brag Document
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    {activeStrategy.content.bragDocument?.map((section, idx) => (
                      <div key={idx} className="bg-muted/30 p-5 rounded-2xl border border-border">
                        <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-3 uppercase tracking-wider text-sm">{section.theme}</h4>
                        <ul className="space-y-2">
                          {section.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm font-medium">
                              <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* The Script */}
                <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" /> 1-on-1 Negotiation Script
                    </h3>
                    <Button onClick={() => copyToClipboard(activeStrategy.content.script.join('\n\n'))} variant="ghost" size="sm" className="h-8 font-bold">
                      <Copy className="h-4 w-4 mr-2" /> Copy Script
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {activeStrategy.content.script?.map((line, idx) => {
                      const isYou = line.startsWith("You:");
                      return (
                        <div key={idx} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                            isYou 
                              ? "bg-blue-500 text-white rounded-tr-sm" 
                              : "bg-muted text-foreground rounded-tl-sm border border-border"
                          }`}>
                            <span className="font-bold opacity-70 block mb-1 text-xs">{isYou ? "You" : "Manager"}</span>
                            {line.replace(/^(You:|Manager:)\s*/, '')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-10 w-10 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Ready to Level Up?</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter your achievements from the past year. The AI will calculate your value and give you the exact script to use in your 1-on-1 to get that promotion.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
