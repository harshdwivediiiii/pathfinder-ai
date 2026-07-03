"use client";

import { useState, useEffect } from "react";
import { generateCultureMatch, getCultureMatches } from "@/actions/culture-match";
import { Sparkles, CheckCircle2, Copy, Link as LinkIcon, FileText, AlertTriangle, HelpCircle, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function CultureMatcherPage() {
  const [content, setContent] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [activeTab, setActiveTab] = useState("url");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      const res = await getCultureMatches();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveAnalysis(res.data[0].analysis);
      }
    }
    loadHistory();
  }, []);

  const handleMatch = async () => {
    if (activeTab === "text" && content.trim().length < 20) {
      toast.error("Please paste more of the company's culture content for an accurate analysis.");
      return;
    }
    if (activeTab === "url" && !companyUrl.trim().startsWith("http")) {
      toast.error("Please enter a valid Company URL.");
      return;
    }

    setLoading(true);
    const data = activeTab === "url" ? { companyUrl: companyUrl.trim() } : { companyContent: content };
    const res = await generateCultureMatch(data);
    if (res.success) {
      toast.success("Culture Match report generated!");
      setHistory([res.data, ...history]);
      setActiveAnalysis(res.data.analysis);
      if (activeTab === "text") setContent("");
      if (activeTab === "url") setCompanyUrl("");
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate report");
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
              <Building2 className="h-3 w-3" />
              Company Culture Matcher
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Culture <span className="text-gradient-primary">Alignment</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Analyze a company's values against your Ikigai to generate personalized interview questions and spot red flags.
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
                    <h3 className="font-bold text-lg mb-2">Company URL</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter the company's "About Us" or "Careers" page URL. We'll try to extract their culture values automatically.
                    </p>
                    <Input
                      placeholder="https://company.com/about"
                      className="h-12 rounded-xl bg-background focus-visible:ring-primary mb-4"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">Paste Company Values</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Copy text from their website, job description, or employee reviews and paste it here.
                    </p>
                    <Textarea
                      placeholder="E.g. We move fast and break things. We value transparency..."
                      className="min-h-[300px] rounded-2xl resize-none bg-background focus-visible:ring-primary mb-4"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleMatch}
                disabled={loading || (activeTab === "text" && content.trim().length < 20) || (activeTab === "url" && !companyUrl.trim().startsWith("http"))}
                className="w-full h-12 rounded-xl font-bold mt-4"
              >
                {loading ? "Analyzing..." : "Analyze Alignment"} <Sparkles className="ml-2 h-4 w-4" />
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
                  <h2 className="text-2xl font-bold">Culture Match Report</h2>
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                    Score: {activeAnalysis.alignmentScore}/100
                  </div>
                </div>
                
                <div className="bg-muted/30 p-5 rounded-xl border border-border text-sm leading-relaxed text-foreground font-medium">
                  {activeAnalysis.summary}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAnalysis.greenFlags && activeAnalysis.greenFlags.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-green-500">
                        <CheckCircle2 className="h-5 w-5" /> Green Flags
                      </h3>
                      <div className="space-y-2">
                        {activeAnalysis.greenFlags.map((flag, idx) => (
                          <div key={idx} className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-sm">
                            {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeAnalysis.redFlags && activeAnalysis.redFlags.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-5 w-5" /> Potential Concerns
                      </h3>
                      <div className="space-y-2">
                        {activeAnalysis.redFlags.map((flag, idx) => (
                          <div key={idx} className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-sm">
                            {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {activeAnalysis.recommendedQuestions && activeAnalysis.recommendedQuestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" /> Questions to Ask the Interviewer
                    </h3>
                    <div className="space-y-4">
                      {activeAnalysis.recommendedQuestions.map((q, idx) => (
                        <div key={idx} className="bg-muted/30 p-5 rounded-xl border border-border group relative">
                          <h4 className="font-bold text-sm mb-2 pr-8">{q.question}</h4>
                          <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded-md border border-border/50">
                            <span className="font-bold">Why ask this:</span> {q.rationale}
                          </p>
                          <button 
                            onClick={() => copyToClipboard(q.question)} 
                            className="absolute top-4 right-4 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
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
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Match Report Yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter a company URL or paste their values text to compare against your Ikigai and uncover culture fit.
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
