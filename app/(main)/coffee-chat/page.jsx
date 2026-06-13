"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Send, Loader2, User, Bot, Plus, ArrowRight, MessageSquare, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { startCoffeeChat, sendCoffeeChatMessage, generateCoffeeChatFeedback, getCoffeeChatSessions } from "@/actions/coffee-chat";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CoffeeChatPage() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  
  const [industry, setIndustry] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.chatHistory]);

  const loadSessions = async () => {
    const res = await getCoffeeChatSessions();
    if (res.success) {
      setSessions(res.data);
    }
  };

  const handleStart = async () => {
    if (!industry || !targetRole) {
      toast.error("Industry and Target Role are required.");
      return;
    }

    setIsStarting(true);
    try {
      const res = await startCoffeeChat(industry, targetRole);
      if (res.success) {
        setIndustry("");
        setTargetRole("");
        setCurrentSession(res.data);
        loadSessions();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to start session");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentSession || isSending) return;

    const userMsg = message;
    setMessage("");
    
    // Optimistic update
    const tempSession = { ...currentSession };
    tempSession.chatHistory = [...tempSession.chatHistory, { role: "user", content: userMsg }];
    setCurrentSession(tempSession);

    setIsSending(true);
    try {
      const res = await sendCoffeeChatMessage(currentSession.id, userMsg);
      if (res.success) {
        setCurrentSession(res.data);
        loadSessions();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to send message");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleEndChat = async () => {
    if (!currentSession) return;
    setIsGeneratingFeedback(true);
    try {
      const res = await generateCoffeeChatFeedback(currentSession.id);
      if (res.success) {
        toast.success("Feedback generated!");
        setCurrentSession(res.data);
        loadSessions();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to generate feedback");
      }
    } catch (error) {
      toast.error("Failed to generate feedback");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <Coffee className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Coffee Chat Simulator</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Practice Your <span className="text-gradient-primary">Networking.</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-hidden">
          <Button 
            onClick={() => setCurrentSession(null)}
            className="w-full justify-start h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setCurrentSession(session)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                  currentSession?.id === session.id 
                    ? "bg-amber-500/10 border border-amber-500/30 shadow-sm" 
                    : "bg-background/40 border border-transparent hover:border-border"
                }`}
              >
                <p className="text-sm font-bold text-foreground truncate">{session.targetRole}</p>
                <p className="text-xs text-muted-foreground truncate">{session.industry}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-muted-foreground">{format(new Date(session.createdAt), "MMM d")}</p>
                  {session.feedback && <Award className="h-3 w-3 text-emerald-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div className="lg:col-span-3 h-full glass rounded-3xl border border-border flex flex-col overflow-hidden">
          {currentSession ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Senior Executive</h3>
                  <p className="text-xs text-muted-foreground">{currentSession.targetRole} in {currentSession.industry}</p>
                </div>
                {!currentSession.feedback && (
                  <Button onClick={handleEndChat} disabled={isGeneratingFeedback} size="sm" variant="outline" className="rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                    {isGeneratingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Coffee className="h-4 w-4 mr-2" />}
                    End Chat & Get Feedback
                  </Button>
                )}
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-gradient-to-b from-background/50 to-background/20">
                {currentSession.chatHistory.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-amber-500/20 text-amber-500"
                    }`}>
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[80%] ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted/50 border border-border rounded-tl-none"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isSending && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border rounded-tl-none flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Typing...</span>
                    </div>
                  </div>
                )}
                
                {currentSession.feedback && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Award className="h-6 w-6 text-emerald-500" />
                      <h3 className="text-lg font-bold text-emerald-500">Feedback Session Complete (Score: {currentSession.feedback.overallScore}/100)</h3>
                    </div>
                    <p className="text-sm text-foreground mb-6">{currentSession.feedback.summary}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Strengths</h4>
                        <ul className="space-y-1">
                          {currentSession.feedback.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-emerald-500 mt-1">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">To Improve</h4>
                        <ul className="space-y-1">
                          {currentSession.feedback.areasForImprovement.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {!currentSession.feedback && (
                <div className="p-4 border-t border-border bg-background/50">
                  <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="pr-12 h-12 rounded-xl bg-background border-border"
                      disabled={isSending}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!message.trim() || isSending}
                      className="absolute right-1.5 h-9 w-9 rounded-lg"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 bg-amber-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    <Coffee className="h-8 w-8 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Start a Coffee Chat</h2>
                  <p className="text-sm text-muted-foreground">Set up a mock informational interview with an AI executive.</p>
                </div>

                <div className="space-y-4 p-6 glass rounded-3xl border border-border">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Industry</label>
                    <Input 
                      placeholder="e.g. Fintech, Healthcare, SaaS" 
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="bg-background/50 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Target Role</label>
                    <Input 
                      placeholder="e.g. Product Manager, Software Engineer" 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="bg-background/50 h-12 rounded-xl"
                    />
                  </div>
                  <Button 
                    onClick={handleStart}
                    disabled={isStarting || !industry || !targetRole}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold mt-4"
                  >
                    {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coffee className="mr-2 h-4 w-4" />}
                    Pour the Coffee
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
