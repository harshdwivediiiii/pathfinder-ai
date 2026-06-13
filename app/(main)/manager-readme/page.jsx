"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Send, Loader2, MessageSquare, ShieldAlert, Target, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildReadme, getManagerReadmes } from "@/actions/manager-readme";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function ManagerReadmePage() {
  const [style, setStyle] = useState("");
  const [boundaries, setBoundaries] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentReadme, setCurrentReadme] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getManagerReadmes();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentReadme(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!style.trim() || !boundaries.trim() || !feedback.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await buildReadme(style, boundaries, feedback);
      if (res.success) {
        toast.success("README generated!");
        setStyle("");
        setBoundaries("");
        setFeedback("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to generate README");
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Manager README Builder</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Lead with <span className="text-gradient-primary">Clarity.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A "Manager README" is an operating manual for how to work with you. It accelerates trust and removes friction for new teams. Dump your working style here and we'll format it beautifully.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Your Operating Manual</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-indigo-500 flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Communication Style & Role
                </label>
                <Textarea
                  placeholder="E.g., I view my role as an unblocker. I prefer Slack for quick questions and email for decisions..."
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-indigo-500/20 rounded-2xl focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-amber-500 flex items-center gap-1.5">
                  <ShieldAlert className="h-3 w-3" /> Boundaries & Quirks
                </label>
                <Textarea
                  placeholder="E.g., I am offline from 5pm-8pm for family time. A quirk: I think out loud in meetings, it's not a directive..."
                  value={boundaries}
                  onChange={(e) => setBoundaries(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-amber-500/20 rounded-2xl focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Feedback Philosophy
                </label>
                <Textarea
                  placeholder="E.g., I prefer direct, immediate feedback. If I mess up, please tell me. I will give you feedback weekly..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50 border-emerald-500/20 rounded-2xl focus:border-emerald-500"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !style.trim() || !boundaries.trim() || !feedback.trim()}
                className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold mt-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building README...
                  </>
                ) : (
                  <>
                    Generate README
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past READMEs</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentReadme(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentReadme?.id === item.id 
                        ? "bg-cyan-500/10 border border-cyan-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className={`h-4 w-4 shrink-0 ${currentReadme?.id === item.id ? "text-cyan-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">Manager README</p>
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
            {currentReadme ? (
              <motion.div
                key={currentReadme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-8 glass rounded-3xl border border-border bg-background/50 relative">
                  <div className="absolute top-6 right-6">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => copyToClipboard(currentReadme.readmeData.readmeMarkdown)}>
                      Copy Markdown
                    </Button>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {currentReadme.readmeData.readmeMarkdown}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="p-6 glass rounded-3xl border border-blue-500/30 bg-blue-500/5 flex items-start gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-full text-blue-500 shrink-0">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-500 mb-1">How to use this</h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      Copy the Markdown above and paste it into a Notion page, Confluence doc, or GitHub repository. Share it with new hires during their first week, or pin it in your team's Slack channel.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-cyan-500/30">
                <BookOpen className="h-12 w-12 text-cyan-500/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No READMEs generated.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Provide your communication styles and boundaries, and we'll format them into a beautiful markdown document.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
