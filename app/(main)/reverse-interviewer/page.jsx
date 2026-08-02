"use client";

import { useState } from "react";
import { generateQuestions } from "@/actions/reverse-interviewer";
import { 
  Briefcase, Sparkles, AlertTriangle, 
  Target, GraduationCap, Copy, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ReverseInterviewerPage() {
  const [loading, setLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [companyContext, setCompanyContext] = useState("");
  const [interviewerRole, setInterviewerRole] = useState("Hiring Manager");
  const [result, setResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const INTERVIEWER_ROLES = [
    "Recruiter / HR",
    "Hiring Manager",
    "Peer / Team Member",
    "Executive / Founder"
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobTitle || !companyContext || !interviewerRole) return;
    
    setLoading(true);
    try {
      const res = await generateQuestions(jobTitle, companyContext, interviewerRole);
      
      if (res.success) {
        setResult(res.data);
        toast.success("Interview Cheat Sheet Generated!");
      } else {
        toast.error(res.errors?._form?.[0] || "Failed to generate questions");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] -z-10 -translate-y-1/2" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 translate-y-1/3" />
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4 mb-12"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-500 font-bold text-xs uppercase tracking-[0.2em] border border-purple-500/20">
            <GraduationCap className="h-4 w-4" />
            Interview Mastery
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            The Reverse <span className="text-purple-500">Interviewer</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl">
            Never freeze when they ask: "Do you have any questions for me?" Generate a strategic cheat sheet to impress them and expose toxic red flags.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
              <h3 className="font-bold text-lg mb-4">Interview Details</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="target-role" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Role</Label>
                  <Input
                    id="target-role"
                    placeholder="e.g. Senior Frontend Engineer"
                    className="h-12 rounded-xl bg-background focus-visible:ring-purple-500"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-context" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Company & Industry</Label>
                  <Input
                    id="company-context"
                    placeholder="e.g. Stripe (Fintech Startup)"
                    className="h-12 rounded-xl bg-background focus-visible:ring-purple-500"
                    value={companyContext}
                    onChange={(e) => setCompanyContext(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label id="interviewer-role-label" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Who are you asking?</Label>
                  <div className="grid grid-cols-1 gap-2" role="group" aria-labelledby="interviewer-role-label">
                    {INTERVIEWER_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInterviewerRole(role)}
                        aria-pressed={interviewerRole === role}
                        className={\`flex items-center p-3 rounded-xl border text-left transition-all \${
                          interviewerRole === role 
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-600 font-bold" 
                            : "bg-background border-border/50 hover:border-border font-medium text-muted-foreground"
                        }\`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !jobTitle || !companyContext}
                  className="w-full h-12 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 mt-4"
                >
                  {loading ? "Generating Questions..." : "Generate Cheat Sheet"} <Sparkles className="ml-2 h-4 w-4" />
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
                  {/* The Show-Offs */}
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">The "Show-Off" Questions</h3>
                        <p className="text-xs text-muted-foreground">Proves you understand the business and the role.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {result.showOffQuestions.map((q, idx) => (
                        <div key={'show'+idx} className="p-4 bg-muted/30 rounded-2xl border border-border/50 relative group">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                            onClick={() => handleCopy(q.question, 'show'+idx)}
                            aria-label="Copy question to clipboard"
                          >
                            {copiedIndex === 'show'+idx ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <p className="font-semibold text-foreground pr-8 text-base">"{q.question}"</p>
                          <p className="text-sm text-muted-foreground mt-2 border-t border-border/50 pt-2">
                            <span className="font-semibold text-blue-500">Why it works:</span> {q.strategy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* The Red Flag Exposers */}
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">The "Red Flag Exposers"</h3>
                        <p className="text-xs text-muted-foreground">Subtly uncovers toxic culture or bad management.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {result.redFlagQuestions.map((q, idx) => (
                        <div key={'red'+idx} className="p-4 bg-destructive/5 rounded-2xl border border-destructive/10 relative group">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                            onClick={() => handleCopy(q.question, 'red'+idx)}
                            aria-label="Copy question to clipboard"
                          >
                            {copiedIndex === 'red'+idx ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <p className="font-semibold text-foreground pr-8 text-base">"{q.question}"</p>
                          <p className="text-sm text-muted-foreground mt-2 border-t border-destructive/10 pt-2">
                            <span className="font-semibold text-destructive">What it exposes:</span> {q.strategy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* The Closer */}
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Target className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">The "Closer"</h3>
                        <p className="text-xs text-muted-foreground">The final question to gauge your standing.</p>
                      </div>
                    </div>
                    <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 relative group">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-2 h-8 w-8 text-emerald-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity bg-white/50"
                        onClick={() => handleCopy(result.closingQuestion.question, 'close')}
                        aria-label="Copy question to clipboard"
                      >
                        {copiedIndex === 'close' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-emerald-600" />}
                      </Button>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 pr-8 text-lg">"{result.closingQuestion.question}"</p>
                      <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80 mt-3 font-medium">
                        {result.closingQuestion.strategy}
                      </p>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div key="empty" className="h-full min-h-[500px] flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                  <div className="max-w-md space-y-4">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">No Cheat Sheet Generated</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Enter the role and company details on the left. The AI will generate a highly strategic set of questions for you to ask the interviewer.
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
