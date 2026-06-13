"use client";

import { useState, useRef, useEffect } from "react";
import { chatSalaryNegotiation, evaluateNegotiation } from "@/actions/negotiation";
import { DollarSign, Send, User, Bot, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SalaryNegotiationPage() {
  const [messages, setMessages] = useState([
    { role: "model", content: "Hi there. Thanks for taking the time to chat. We're very excited to offer you the position. We've put together an initial offer of $90,000 base salary with a standard benefits package. How does that sound?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || evaluating) return;

    const userMessage = input.trim();
    setInput("");
    
    const newHistory = [...messages, { role: "user", content: userMessage }];
    setMessages(newHistory);
    setLoading(true);

    const res = await chatSalaryNegotiation(messages, userMessage);
    if (res.success) {
      setMessages([...newHistory, { role: "model", content: res.response }]);
    } else {
      toast.error(res.error || "Failed to get a response");
      // Remove user message if failed
      setMessages(messages);
    }
    setLoading(false);
  };

  const handleEndNegotiation = async () => {
    if (messages.length < 3) {
      toast.error("You need to negotiate a bit more before evaluating!");
      return;
    }
    
    setEvaluating(true);
    const res = await evaluateNegotiation(messages);
    if (res.success) {
      setEvaluation(res.data);
      toast.success("Evaluation complete!");
    } else {
      toast.error(res.error);
    }
    setEvaluating(false);
  };

  const handleRestart = () => {
    setMessages([
      { role: "model", content: "Hi there. Thanks for taking the time to chat. We're very excited to offer you the position. We've put together an initial offer of $90,000 base salary with a standard benefits package. How does that sound?" }
    ]);
    setEvaluation(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-10 flex flex-col h-[calc(100vh-2rem)]">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-6 mb-6 shrink-0"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <DollarSign className="h-3 w-3" />
              Negotiation Simulator
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Salary <span className="text-gradient-primary">Coach</span>
            </h1>
          </div>

          {!evaluation && (
            <Button 
              onClick={handleEndNegotiation} 
              disabled={loading || evaluating || messages.length < 3}
              variant="outline"
              className="rounded-xl border-primary text-primary hover:bg-primary/10"
            >
              {evaluating ? "Evaluating..." : "End & Evaluate"}
            </Button>
          )}
        </motion.div>

        {evaluation ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 bg-card border border-border p-8 rounded-3xl shadow-xl overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-6 mb-6">
              <h2 className="text-3xl font-bold">Negotiation Results</h2>
              <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-black text-2xl flex items-center gap-2">
                Score: {evaluation.score}/100
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                <h3 className="text-lg font-bold mb-2">Overall Feedback</h3>
                <p className="text-muted-foreground">{evaluation.overallFeedback}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-5 w-5" /> What You Did Well
                  </h3>
                  <div className="space-y-3">
                    {evaluation.strengths?.map((str, idx) => (
                      <div key={idx} className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-sm font-medium">
                        {str}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-red-500">
                    <CheckCircle2 className="h-5 w-5" /> Areas to Improve
                  </h3>
                  <div className="space-y-3">
                    {evaluation.weaknesses?.map((weak, idx) => (
                      <div key={idx} className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-sm font-medium">
                        {weak}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50 flex justify-center">
                <Button onClick={handleRestart} className="h-12 px-8 rounded-xl font-bold">
                  Practice Again
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 bg-card border border-border rounded-3xl shadow-sm flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground border border-border'
                    }`}>
                      {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted/50 border border-border rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 max-w-[80%]"
                  >
                    <div className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-muted text-foreground border border-border">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="p-4 rounded-2xl text-sm bg-muted/50 border border-border rounded-tl-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-muted/20">
              <form onSubmit={handleSend} className="relative flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your negotiation response..."
                  className="pr-12 h-14 rounded-2xl bg-background border-border focus-visible:ring-primary shadow-sm"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
