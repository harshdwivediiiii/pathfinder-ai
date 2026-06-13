"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Send, Lightbulb, Target, DollarSign, ArrowRightCircle, Loader2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateSideHustles, getSideHustleIdeas } from "@/actions/side-hustle";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SideHustlePage() {
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentIdeas, setCurrentIdeas] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getSideHustleIdeas();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentIdeas(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!skills.trim() || !interests.trim()) {
      toast.error("Please provide both your skills and interests.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateSideHustles(skills, interests);
      if (res.success) {
        toast.success("Side hustle ideas generated successfully!");
        setSkills("");
        setInterests("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to generate ideas");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
          <Rocket className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Side Hustle Generator</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Monetize Your <span className="text-gradient-primary">Expertise.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Input your professional skills and personal interests. We'll generate hyper-specific micro-businesses or side hustles you can start this weekend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Find Your Hustle</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">What are your skills?</label>
                <Textarea
                  placeholder="E.g., B2B copywriting, React.js, data analysis, graphic design..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">What are your interests/hobbies?</label>
                <Textarea
                  placeholder="E.g., Fitness, specialty coffee, personal finance, dogs..."
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="min-h-[100px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !skills.trim() || !interests.trim()}
                className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Brainstorming...
                  </>
                ) : (
                  <>
                    Generate Ideas
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Idea Generations</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIdeas(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentIdeas?.id === item.id 
                        ? "bg-cyan-500/10 border border-cyan-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Compass className={`h-4 w-4 shrink-0 ${currentIdeas?.id === item.id ? "text-cyan-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">Idea Session</p>
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
            {currentIdeas ? (
              <motion.div
                key={currentIdeas.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {currentIdeas.ideasData.ideas.map((idea, idx) => (
                  <div key={idx} className="p-6 glass rounded-3xl border border-border group relative overflow-hidden transition-all hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -z-10 group-hover:bg-cyan-500/10 transition-all" />
                    
                    <div className="flex items-start gap-4 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20 text-cyan-500">
                        <Lightbulb className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{idea.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{idea.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
                        <div className="flex items-center gap-2 mb-2 text-foreground">
                          <Target className="h-4 w-4 text-emerald-500" />
                          <span className="font-bold text-sm">Target Audience</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{idea.targetAudience}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
                        <div className="flex items-center gap-2 mb-2 text-foreground">
                          <DollarSign className="h-4 w-4 text-amber-500" />
                          <span className="font-bold text-sm">Pricing Strategy</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{idea.pricingStrategy}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-2 text-cyan-500">
                        <ArrowRightCircle className="h-4 w-4" />
                        <span className="font-bold text-sm">First Step to Take Today</span>
                      </div>
                      <p className="text-sm text-foreground font-medium">{idea.firstStep}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <Rocket className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No ideas generated yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Enter your skills and interests to get customized micro-business ideas.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
