"use client";

import { useState, useEffect } from "react";
import { generateNetworkingEmail, getNetworkingEmails } from "@/actions/networking";
import { Mail, Sparkles, Send, Copy, Building2, User, Target, MessageSquareText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function NetworkingPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeEmail, setActiveEmail] = useState(null);
  
  const [formData, setFormData] = useState({
    recipientName: "",
    company: "",
    goal: "Informational Interview",
    context: "",
  });

  useEffect(() => {
    async function loadHistory() {
      const res = await getNetworkingEmails();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveEmail(res.data[0]);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateNetworkingEmail(formData);
    if (res.success) {
      toast.success("Networking emails generated!");
      setHistory([res.data, ...history]);
      setActiveEmail(res.data);
      setFormData({ ...formData, context: "" }); // Reset context but keep company/name
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate emails");
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
              <Send className="h-3 w-3" />
              Networking Outreach
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Smart <span className="text-gradient-primary">Connections</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Generate highly personalized networking and outreach emails in seconds.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">Outreach Details</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Recipient Name (e.g. John Doe)"
                      className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                      value={formData.recipientName}
                      onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                    />
                  </div>

                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Target Company"
                      className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" /> Objective
                    </label>
                    <select
                      className="w-full h-12 px-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={formData.goal}
                      onChange={e => setFormData({ ...formData, goal: e.target.value })}
                    >
                      <option>Informational Interview</option>
                      <option>Job Referral Request</option>
                      <option>Follow-up after Application</option>
                      <option>Alumni Connection</option>
                      <option>General Networking</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                      <MessageSquareText className="h-3.5 w-3.5" /> Additional Context (Optional)
                    </label>
                    <Textarea
                      placeholder="Any specific details to mention? E.g. 'I read your recent post about AI...', 'We both went to State University...'"
                      className="min-h-[100px] rounded-xl resize-none bg-background focus-visible:ring-primary"
                      value={formData.context}
                      onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.goal}
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {loading ? "Drafting..." : "Generate Outreach Emails"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeEmail ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border p-8 rounded-3xl shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Email Variations</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeEmail.goal} • {activeEmail.recipientName || "Hiring Manager"} at {activeEmail.company || "Company"}
                    </p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(activeEmail.content)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Copy className="h-4 w-4" /> Copy All
                  </button>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <ReactMarkdown>{activeEmail.content}</ReactMarkdown>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Emails Drafted</h3>
                  <p className="text-muted-foreground text-sm">
                    Fill out the outreach details on the left to generate customized, high-converting networking emails.
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
