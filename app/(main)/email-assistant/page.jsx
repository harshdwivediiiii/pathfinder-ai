"use client";

import { useState, useEffect } from "react";
import { generateEmailReply, getEmailHistory } from "@/actions/email-assistant";
import { Mail, Sparkles, Send, Copy, MessageSquareText, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function EmailAssistantPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeReply, setActiveReply] = useState(null);
  
  const [formData, setFormData] = useState({
    originalEmail: "",
    goal: "Accept Interview",
  });

  useEffect(() => {
    async function loadHistory() {
      const res = await getEmailHistory();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveReply(res.data[0]);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateEmailReply(formData.originalEmail, formData.goal);
    if (res.success) {
      toast.success("Reply generated!");
      setHistory([res.data, ...history]);
      setActiveReply(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate reply");
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
              <Mail className="h-3 w-3" />
              Communication
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Email <span className="text-gradient-primary">Assistant</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Draft the perfect response to recruiters in seconds.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">Received Email</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                      <MessageSquareText className="h-3.5 w-3.5" /> Paste Recruiter Email
                    </label>
                    <Textarea
                      placeholder="Paste the email you received here..."
                      className="min-h-[200px] rounded-xl resize-none bg-background focus-visible:ring-primary text-sm leading-relaxed"
                      value={formData.originalEmail}
                      onChange={(e) => setFormData({ ...formData, originalEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                      What is your goal?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'Accept Interview', icon: CheckCircle2, color: 'text-green-500' },
                        { id: 'Ask for Extension', icon: CalendarClock, color: 'text-blue-500' },
                        { id: 'Decline Gracefully', icon: XCircle, color: 'text-red-500' },
                        { id: 'Negotiate Offer', icon: Sparkles, color: 'text-purple-500' },
                      ].map((option) => (
                        <div
                          key={option.id}
                          onClick={() => setFormData({ ...formData, goal: option.id })}
                          className={`cursor-pointer border p-3 rounded-xl flex items-center gap-2 transition-all ${
                            formData.goal === option.id 
                              ? 'border-primary bg-primary/10 font-bold' 
                              : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <option.icon className={`h-4 w-4 ${option.color}`} />
                          <span className="text-sm">{option.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.originalEmail}
                  className="w-full h-12 rounded-xl font-bold mt-4"
                >
                  {loading ? "Drafting..." : "Draft Reply"} <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeReply ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border p-8 rounded-3xl shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Drafted Reply</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Goal: {activeReply.goal}
                    </p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(activeReply.replyContent)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground bg-muted/30 p-6 rounded-2xl border border-border">
                  <ReactMarkdown>{activeReply.replyContent}</ReactMarkdown>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Reply Drafted</h3>
                  <p className="text-muted-foreground text-sm">
                    Paste an email from a recruiter on the left, select your goal, and we'll write the perfect professional response.
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
