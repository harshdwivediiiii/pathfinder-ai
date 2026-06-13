"use client";

import { useState, useEffect } from "react";
import { generateStarStory, getStarStories } from "@/actions/star-story";
import { Star, Sparkles, MessageSquare, Target, Zap, Trophy, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function StarBuilderPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [rawExperience, setRawExperience] = useState("");

  useEffect(() => {
    async function loadHistory() {
      const res = await getStarStories();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveStory(res.data[0].starContent);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateStarStory(rawExperience);
    if (res.success) {
      toast.success("STAR story generated!");
      setHistory([res.data, ...history]);
      setActiveStory(res.data.starContent);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate STAR story");
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <Star className="h-3 w-3" />
              Behavioral Prep
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              STAR Story <span className="text-gradient-primary">Builder</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Turn messy experiences into perfectly structured interview answers.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Raw Experience</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> What happened?
                  </label>
                  <Textarea
                    placeholder="E.g. I had to build a new feature but the API was broken, so I contacted the backend team and we paired on it all weekend. It launched on time and users loved it."
                    className="min-h-[250px] rounded-xl resize-none bg-background focus-visible:ring-primary text-sm leading-relaxed"
                    value={rawExperience}
                    onChange={(e) => setRawExperience(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || rawExperience.length < 20}
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {loading ? "Structuring..." : "Build STAR Story"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeStory ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border p-8 rounded-3xl shadow-xl space-y-8"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <h2 className="text-2xl font-bold">{activeStory.title}</h2>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`${activeStory.situation}\n${activeStory.task}\n${activeStory.action}\n${activeStory.result}`)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-blue-500 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" /> Situation
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{activeStory.situation}</p>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-2xl border border-border relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-orange-500 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Task
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{activeStory.task}</p>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-2xl border border-border relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-purple-500 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Action
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{activeStory.action}</p>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-2xl border border-border relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-green-500 mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> Result
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{activeStory.result}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Stories Built</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter a messy experience on the left to instantly generate a clean, powerful STAR story for your next interview.
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
