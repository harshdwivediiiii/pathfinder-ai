"use client";

import { useState, useEffect } from "react";
import { optimizeLinkedInProfile, getLinkedInOptimizations } from "@/actions/linkedin";
import { Sparkles, Linkedin, CheckCircle2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function LinkedInOptimizerPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      const res = await getLinkedInOptimizations();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveAnalysis(res.data[0].analysis);
      }
    }
    loadHistory();
  }, []);

  const handleOptimize = async () => {
    if (content.trim().length < 50) {
      toast.error("Please paste more of your profile content for an accurate analysis.");
      return;
    }

    setLoading(true);
    const res = await optimizeLinkedInProfile({ profileContent: content });
    if (res.success) {
      toast.success("Profile optimized successfully!");
      setHistory([res.data, ...history]);
      setActiveAnalysis(res.data.analysis);
      setContent("");
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to optimize profile");
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
              <Linkedin className="h-3 w-3" />
              LinkedIn Optimizer
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Profile <span className="text-gradient-primary">Analysis</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Paste your LinkedIn profile text and get AI-driven improvements for recruiters.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Paste Your Profile</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Copy your headline, About section, and Experience bullet points directly from LinkedIn and paste them here.
              </p>
              <Textarea
                placeholder="E.g. Senior Software Engineer at Tech Corp...\n\nAbout me: I build scalable systems...\n\nExperience: Led a team of 5..."
                className="min-h-[300px] rounded-2xl resize-none bg-background focus-visible:ring-primary mb-4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <Button
                onClick={handleOptimize}
                disabled={loading || content.trim().length < 50}
                className="w-full h-12 rounded-xl font-bold"
              >
                {loading ? "Analyzing..." : "Analyze Profile"} <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeAnalysis ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border p-8 rounded-3xl shadow-xl space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Optimization Report</h2>
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                    Score: {activeAnalysis.overallScore}/100
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Headline Suggestions
                  </h3>
                  <div className="space-y-3">
                    {activeAnalysis.headlineSuggestions?.map((headline, idx) => (
                      <div key={idx} className="flex items-start justify-between bg-muted/30 p-4 rounded-xl border border-border">
                        <p className="text-sm font-medium pr-4">{headline}</p>
                        <button onClick={() => copyToClipboard(headline)} className="text-muted-foreground hover:text-primary">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> About Section
                  </h3>
                  <div className="bg-muted/30 p-5 rounded-xl border border-border text-sm leading-relaxed text-muted-foreground">
                    {activeAnalysis.summaryImprovements}
                  </div>
                </div>

                {activeAnalysis.experienceFeedback && activeAnalysis.experienceFeedback.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" /> Experience Feedback
                    </h3>
                    <div className="space-y-4">
                      {activeAnalysis.experienceFeedback.map((exp, idx) => (
                        <div key={idx} className="bg-muted/30 p-5 rounded-xl border border-border">
                          <h4 className="font-bold text-sm mb-2">{exp.role}</h4>
                          <p className="text-sm text-muted-foreground">{exp.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> SEO Keywords to Add
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activeAnalysis.seoKeywords?.map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Linkedin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Analysis Yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Paste your profile content on the left to generate your first AI-driven LinkedIn optimization report.
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
