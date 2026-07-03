"use client";

import { useState, useEffect } from "react";
import { optimizeGithubProfile, getGithubAnalyses } from "@/actions/github-analyzer";
import { Sparkles, Github, CheckCircle2, Copy, Link as LinkIcon, FileText, Code } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function GithubAnalyzerPage() {
  const [content, setContent] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [activeTab, setActiveTab] = useState("url");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      const res = await getGithubAnalyses();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveAnalysis(res.data[0].analysis);
      }
    }
    loadHistory();
  }, []);

  const handleOptimize = async () => {
    if (activeTab === "text" && content.trim().length < 20) {
      toast.error("Please paste more of your profile content for an accurate analysis.");
      return;
    }
    if (activeTab === "url" && !githubUrl.trim().startsWith("http")) {
      toast.error("Please enter a valid GitHub URL.");
      return;
    }

    setLoading(true);
    const data = activeTab === "url" ? { githubUrl: githubUrl.trim() } : { profileContent: content };
    const res = await optimizeGithubProfile(data);
    if (res.success) {
      toast.success("Profile analyzed successfully!");
      setHistory([res.data, ...history]);
      setActiveAnalysis(res.data.analysis);
      if (activeTab === "text") setContent("");
      if (activeTab === "url") setGithubUrl("");
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to analyze profile");
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
              <Github className="h-3 w-3" />
              GitHub Analyzer
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Developer <span className="text-gradient-primary">Presence</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Provide your GitHub profile URL to get AI-driven improvements for impressing technical recruiters.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" /> URL
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Paste Text
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">GitHub URL</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your public GitHub profile URL. We will automatically fetch and analyze your profile and pinned repositories.
                    </p>
                    <Input
                      placeholder="https://github.com/yourusername"
                      className="h-12 rounded-xl bg-background focus-visible:ring-primary mb-4"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">Paste Your Profile</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Copy your bio and top repository descriptions directly from GitHub and paste them here.
                    </p>
                    <Textarea
                      placeholder="E.g. Full Stack Developer. Open source enthusiast.\n\nRepositories:\n- awesome-project: A tool for X..."
                      className="min-h-[300px] rounded-2xl resize-none bg-background focus-visible:ring-primary mb-4"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleOptimize}
                disabled={loading || (activeTab === "text" && content.trim().length < 20) || (activeTab === "url" && !githubUrl.trim().startsWith("http"))}
                className="w-full h-12 rounded-xl font-bold mt-4"
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
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Bio Suggestions
                  </h3>
                  <div className="space-y-3">
                    {activeAnalysis.bioSuggestions?.map((bio, idx) => (
                      <div key={idx} className="flex items-start justify-between bg-muted/30 p-4 rounded-xl border border-border">
                        <p className="text-sm font-medium pr-4">{bio}</p>
                        <button onClick={() => copyToClipboard(bio)} className="text-muted-foreground hover:text-primary">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> README Improvements
                  </h3>
                  <div className="bg-muted/30 p-5 rounded-xl border border-border text-sm leading-relaxed text-muted-foreground">
                    {activeAnalysis.readmeImprovements}
                  </div>
                </div>

                {activeAnalysis.repoFeedback && activeAnalysis.repoFeedback.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" /> Repository Feedback
                    </h3>
                    <div className="space-y-4">
                      {activeAnalysis.repoFeedback.map((repo, idx) => (
                        <div key={idx} className="bg-muted/30 p-5 rounded-xl border border-border">
                          <h4 className="font-bold text-sm mb-2">{repo.repoName}</h4>
                          <p className="text-sm text-muted-foreground">{repo.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeAnalysis.activitySuggestions && activeAnalysis.activitySuggestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" /> Activity & Contributions
                    </h3>
                    <div className="flex flex-col gap-2">
                      {activeAnalysis.activitySuggestions?.map((suggestion, idx) => (
                        <div key={idx} className="bg-muted/30 p-4 rounded-xl border border-border text-sm text-muted-foreground">
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Github className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Analysis Yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Paste your GitHub profile URL on the left to generate your first AI-driven developer presence report.
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
