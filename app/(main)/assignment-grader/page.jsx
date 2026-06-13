"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Send, CheckCircle2, AlertCircle, Sparkles, Loader2, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { gradeAssignment, getAssignmentGrades } from "@/actions/assignment";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AssignmentGraderPage() {
  const [promptText, setPromptText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentGrade, setCurrentGrade] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getAssignmentGrades();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentGrade(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!promptText.trim() || !solutionText.trim()) {
      toast.error("Please provide both the assignment prompt and your solution.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await gradeAssignment(promptText, solutionText);
      if (res.success) {
        toast.success("Assignment graded successfully!");
        setPromptText("");
        setSolutionText("");
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to grade assignment");
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
          <Code2 className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Take-Home Grader</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Nail The <span className="text-gradient-primary">Take-Home Test.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Paste the prompt and your solution (code, strategy, etc.). Our AI will grade it like a Senior Hiring Manager, finding edge cases and optimizations before you submit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Submit Assignment</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">The Prompt / Instructions</label>
                <Textarea
                  placeholder="Paste the take-home assignment instructions here..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="min-h-[150px] resize-none bg-background/50 border-border/50 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Your Solution</label>
                <Textarea
                  placeholder="Paste your code, architecture, or written solution here..."
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  className="min-h-[200px] resize-none bg-background/50 border-border/50 rounded-2xl font-mono text-sm"
                />
              </div>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !promptText.trim() || !solutionText.trim()}
                className="w-full h-12 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Grading Solution...
                  </>
                ) : (
                  <>
                    Grade My Work
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-6 glass rounded-3xl border border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Past Grades</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentGrade(item)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      currentGrade?.id === item.id 
                        ? "bg-violet-500/10 border border-violet-500/30" 
                        : "bg-background/40 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileCode2 className={`h-4 w-4 shrink-0 ${currentGrade?.id === item.id ? "text-violet-500" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.prompt}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "MMM d, yyyy")}</p>
                      </div>
                      <div className="ml-auto font-black text-violet-500 text-sm">
                        {item.gradeData.score}
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
            {currentGrade ? (
              <motion.div
                key={currentGrade.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score Header */}
                <div className="flex flex-col md:flex-row gap-6 p-6 glass rounded-3xl border border-border items-center">
                  <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center shrink-0 ${
                    currentGrade.gradeData.score >= 80 ? 'border-emerald-500 text-emerald-500' : 
                    currentGrade.gradeData.score >= 60 ? 'border-amber-500 text-amber-500' : 
                    'border-red-500 text-red-500'
                  }`}>
                    <span className="text-4xl font-black">{currentGrade.gradeData.score}</span>
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-2xl font-bold">
                      Verdict: <span className={
                        currentGrade.gradeData.finalVerdict.includes("Pass") ? "text-emerald-500" :
                        currentGrade.gradeData.finalVerdict.includes("Borderline") ? "text-amber-500" :
                        "text-red-500"
                      }>{currentGrade.gradeData.finalVerdict}</span>
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentGrade.gradeData.overallFeedback}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Strengths */}
                  <div className="p-6 glass rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
                    <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5" />
                      Strengths
                    </h3>
                    <ul className="space-y-3">
                      {currentGrade.gradeData.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-emerald-500 mt-1">•</span>
                          <span className="text-sm text-foreground">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Edge Cases Missed */}
                  <div className="p-6 glass rounded-3xl border border-red-500/30 bg-red-500/5">
                    <h3 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-4">
                      <AlertCircle className="h-5 w-5" />
                      Edge Cases Missed
                    </h3>
                    <ul className="space-y-3">
                      {currentGrade.gradeData.edgeCasesMissed.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-red-500 mt-1">•</span>
                          <span className="text-sm text-foreground">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Optimizations */}
                  <div className="p-6 glass rounded-3xl border border-violet-500/30 bg-violet-500/5">
                    <h3 className="text-lg font-bold text-violet-500 flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5" />
                      Optimizations
                    </h3>
                    <ul className="space-y-3">
                      {currentGrade.gradeData.optimizations.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-violet-500 mt-1">•</span>
                          <span className="text-sm text-foreground">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <Code2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No grades yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Submit your prompt and solution on the left to get a Senior Engineer's review.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
