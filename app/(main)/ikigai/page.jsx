"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Send, Sparkles, Loader2, Target, Heart, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { discoverIkigai, getIkigaiDiscoveries } from "@/actions/ikigai";
import { toast } from "sonner";
import { format } from "date-fns";

export default function IkigaiPage() {
  const [passions, setPassions] = useState("");
  const [skills, setSkills] = useState("");
  const [marketNeeds, setMarketNeeds] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentDiscovery, setCurrentDiscovery] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getIkigaiDiscoveries();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentDiscovery(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!passions.trim() || !skills.trim() || !marketNeeds.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await discoverIkigai(passions, skills, marketNeeds);
      if (res.success) {
        toast.success("Ikigai paths discovered!");
        setPassions("");
        setSkills("");
        setMarketNeeds("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to discover Ikigai");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500">
          <Compass className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Ikigai Builder</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Find Your <span className="text-gradient-primary">Reason for Being.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ikigai (生き甲斐) is the intersection of what you love, what you're good at, what the world needs, and what you can be paid for. Let's find yours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">The Four Pillars</h3>
            <div className="space-y-5">
              <div className="space-y-2 relative">
                <div className="flex items-center gap-2 text-rose-500 mb-1">
                  <Heart className="h-4 w-4" />
                  <label className="text-xs font-bold uppercase">What do you love?</label>
                </div>
                <Textarea
                  placeholder="I love teaching others, organizing chaos, and reading about psychology..."
                  value={passions}
                  onChange={(e) => setPassions(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-border/50 rounded-2xl focus:border-rose-500"
                />
              </div>

              <div className="space-y-2 relative">
                <div className="flex items-center gap-2 text-indigo-500 mb-1">
                  <Briefcase className="h-4 w-4" />
                  <label className="text-xs font-bold uppercase">What are you good at?</label>
                </div>
                <Textarea
                  placeholder="I'm great at data analysis, writing clear emails, and public speaking..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-border/50 rounded-2xl focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 relative">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <Globe className="h-4 w-4" />
                  <label className="text-xs font-bold uppercase">What does the world need (and pay for)?</label>
                </div>
                <Textarea
                  placeholder="Companies need better onboarding processes, people need mental health resources..."
                  value={marketNeeds}
                  onChange={(e) => setMarketNeeds(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-border/50 rounded-2xl focus:border-emerald-500"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !passions.trim() || !skills.trim() || !marketNeeds.trim()}
                className="w-full h-12 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold mt-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Discovering Paths...
                  </>
                ) : (
                  <>
                    Discover My Ikigai
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Discoveries</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentDiscovery(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentDiscovery?.id === item.id 
                        ? "bg-violet-500/10 border border-violet-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Target className={`h-4 w-4 shrink-0 ${currentDiscovery?.id === item.id ? "text-violet-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">Discovery</p>
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
            {currentDiscovery ? (
              <motion.div
                key={currentDiscovery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Mission Statement */}
                <div className="p-8 glass rounded-3xl border border-violet-500/30 bg-violet-500/5 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="h-24 w-24 text-violet-500" />
                  </div>
                  <h3 className="text-sm font-bold text-violet-500 uppercase tracking-widest mb-4">
                    Your Personal Mission
                  </h3>
                  <p className="text-xl md:text-2xl font-serif italic text-foreground leading-relaxed relative z-10">
                    "{currentDiscovery.ikigaiData.missionStatement}"
                  </p>
                </div>

                {/* Paths */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Compass className="h-5 w-5 text-indigo-500" />
                    Potential Paths Forward
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {currentDiscovery.ikigaiData.ikigaiPaths.map((path, idx) => (
                      <div key={idx} className="p-6 glass rounded-3xl border border-border hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <h4 className="text-base font-bold text-foreground">{path.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {path.description}
                        </p>
                        <div className="pt-4 border-t border-border">
                          <p className="text-xs font-bold uppercase text-emerald-500 mb-1">First Step:</p>
                          <p className="text-sm text-foreground">{path.firstStep}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <Compass className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No paths discovered.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Fill out the four pillars to find the intersection of your passion, mission, vocation, and profession.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
