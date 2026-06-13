"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  PlusCircle,
  Menu,
  X,
  MessageSquare,
  FileText,
  Users,
  Briefcase,
  Search,
  Settings,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useStreamFetch from "@/hooks/use-stream-fetch";
import StreamedText, { markdownComponents } from "@/components/streamed-text";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInMins < 1) return "Just now";
  if (diffInHours < 1) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [saveChatHistory, setSaveChatHistory] = useState(true);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [debugContext, setDebugContext] = useState(null);

  const scrollRef = useRef(null);
  const { streamedText, isLoading, error, startStream, reset } = useStreamFetch();
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    const savedState = localStorage.getItem("ai-sidebar-expanded");
    if (savedState !== null) {
      setIsSidebarExpanded(savedState === "true");
    }
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsMobileOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarExpanded;
    setIsSidebarExpanded(newState);
    localStorage.setItem("ai-sidebar-expanded", String(newState));
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (res.ok) setConversations(Array.isArray(data) ? data : data.conversations ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (id) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setActiveConversationId(id);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        reset();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createConversation = async (firstMessage) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: firstMessage.slice(0, 50) }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveConversationId(data.id);
        setMessages([]);
        setDebugContext(null);
        await fetchConversations();
        return data.id;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const deleteConversation = async (id) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
        setDebugContext(null);
        reset();
      }
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/user/preferences");
      if (res.ok) {
        const data = await res.json();
        setSaveChatHistory(data.saveChatHistory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  const updateSaveChatHistory = async (newValue) => {
    const previousValue = saveChatHistory;
    setSaveChatHistory(newValue);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveChatHistory: newValue }),
      });
      if (!res.ok) throw new Error("Failed to save preference");
    } catch (err) {
      setSaveChatHistory(previousValue);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchPreferences();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedText, messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    let conversationId = activeConversationId;
    if (!conversationId && saveChatHistory) {
      conversationId = await createConversation(trimmed);
    }

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    const streamResult = await startStream(trimmed, conversationId);
    if (streamResult?.status === "done" && streamResult.finalText?.trim()) {
      setMessages((prev) => [...prev, { role: "assistant", content: streamResult.finalText }]);
      setDebugContext(streamResult.meta?.debug ?? null);
      reset();
    }
    if (saveChatHistory) fetchConversations();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] flex overflow-hidden bg-background">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? (isMobileOpen ? 320 : 0) : (isSidebarExpanded ? 320 : 80),
          opacity: isMobile && !isMobileOpen ? 0 : 1
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={cn(
          "relative z-50 h-full flex flex-col border-r border-border bg-card/50 backdrop-blur-xl overflow-hidden shrink-0",
          isMobile && !isMobileOpen && "border-none absolute"
        )}
      >
        <motion.div 
          animate={{ width: isMobile ? 320 : (isSidebarExpanded ? 320 : 80) }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex flex-col h-full"
        >
          <div className={cn("flex flex-col gap-6", isSidebarExpanded || isMobile ? "p-6" : "p-4 py-6 items-center")}>
            <div className={cn("flex items-center", isSidebarExpanded || isMobile ? "justify-between" : "justify-center w-full")}>
              {(isSidebarExpanded || isMobile) && (
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Chat History</h2>
              )}
              <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={toggleSidebar} title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}>
                {isSidebarExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Button
              className={cn(
                "h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] group shrink-0",
                isSidebarExpanded || isMobile ? "w-full" : "w-12 p-0 mx-auto"
              )}
              onClick={() => {
                setActiveConversationId(null);
                setMessages([]);
                reset();
                if (isMobile) setIsMobileOpen(false);
              }}
              title={!isSidebarExpanded && !isMobile ? "New Conversation" : undefined}
            >
              <PlusCircle className={cn("h-5 w-5", (isSidebarExpanded || isMobile) && "mr-2")} />
              {(isSidebarExpanded || isMobile) && "New Conversation"}
            </Button>

            {(isSidebarExpanded || isMobile) && (
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 rounded-2xl bg-muted/50 border-none pl-11 pr-4 text-sm outline-none ring-0 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            )}
          </div>

          <div className={cn("flex-1 overflow-y-auto space-y-2 custom-scrollbar", isSidebarExpanded || isMobile ? "px-4" : "px-2")}>
            {isLoadingConversations ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className={cn("rounded-2xl bg-muted/30 animate-pulse", isSidebarExpanded || isMobile ? "h-16 w-full" : "h-12 w-12 mx-auto")} />
              ))
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    loadConversation(conv.id);
                    if (isMobile) setIsMobileOpen(false);
                  }}
                  title={!isSidebarExpanded && !isMobile ? (conv.title || "New Chat") : undefined}
                  className={cn(
                    "group relative rounded-2xl cursor-pointer transition-all duration-200 flex items-center",
                    isSidebarExpanded || isMobile ? "p-4" : "p-3 mx-auto w-12 h-12 justify-center",
                    activeConversationId === conv.id 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  {isSidebarExpanded || isMobile ? (
                    <>
                      <div className="flex flex-col gap-1 min-w-0 pr-8">
                        <p className="text-sm font-bold truncate">{conv.title || "New Chat"}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                          {formatTime(conv.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <MessageSquare className="h-5 w-5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className={cn("border-t border-border mt-auto", isSidebarExpanded || isMobile ? "p-6" : "p-4 flex justify-center")}>
            {isSidebarExpanded || isMobile ? (
              <div className="p-4 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">Save History</span>
                </div>
                <div 
                  onClick={() => updateSaveChatHistory(!saveChatHistory)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors cursor-pointer relative p-0.5",
                    saveChatHistory ? "bg-primary" : "bg-border"
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    saveChatHistory ? "translate-x-5" : "translate-x-0"
                  )} />
                </div>
              </div>
            ) : (
              <div 
                onClick={() => updateSaveChatHistory(!saveChatHistory)}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-colors hover:bg-muted",
                  saveChatHistory ? "text-primary" : "text-muted-foreground"
                )}
                title={saveChatHistory ? "History Saved: ON" : "History Saved: OFF"}
              >
                <Settings className="h-5 w-5" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Chat Header */}
        <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-background/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            {isMobile && !isMobileOpen && (
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Career Assistant
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Engine Online</span>
          </div>
        </header>

        {isDev && debugContext && (
          <div className="border-b border-border bg-card/60 px-6 py-4 backdrop-blur-xl">
            <Card className="rounded-[1.75rem] border-primary/10 bg-background/80 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Injected Prompt Context
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-0 text-xs">
                <details open className="rounded-2xl border border-border bg-muted/30 p-4">
                  <summary className="cursor-pointer list-none font-bold uppercase tracking-[0.18em] text-foreground">
                    Profile Context
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap break-words text-muted-foreground">
                    {debugContext.profileContext}
                  </pre>
                </details>
                {debugContext.recentTurns?.length > 0 && (
                  <details className="rounded-2xl border border-border bg-muted/30 p-4">
                    <summary className="cursor-pointer list-none font-bold uppercase tracking-[0.18em] text-foreground">
                      Recent Turns
                    </summary>
                    <pre className="mt-3 whitespace-pre-wrap break-words text-muted-foreground">
                      {debugContext.conversationContext}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
              <div className="h-24 w-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-2xl">
                <Bot className="h-12 w-12" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                  Ready to <span className="text-gradient-primary">Accelerate?</span>
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  I&apos;m your specialized career intelligence. Ask me about industry trends, 
                  resume optimization, or mock interview strategies.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-8">
                {[
                  { icon: <FileText className="h-4 w-4" />, label: "Optimize my resume", color: "bg-blue-500" },
                  { icon: <Briefcase className="h-4 w-4" />, label: "Salary negotiation tips", color: "bg-emerald-500" },
                  { icon: <Users className="h-4 w-4" />, label: "Practice mock interview", color: "bg-purple-500" },
                  { icon: <MessageSquare className="h-4 w-4" />, label: "Write a cover letter", color: "bg-rose-500" },
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s.label)}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-sm font-bold text-left group"
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white", s.color)}>
                      {s.icon}
                    </div>
                    {s.label}
                    <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-10">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start gap-4 md:gap-6",
                  msg.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                  msg.role === "assistant" ? "bg-primary text-primary-foreground border-primary/20" : "bg-muted text-muted-foreground border-border"
                )}>
                  {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>

                <div className={cn(
                  "px-6 py-4 rounded-3xl text-sm md:text-base leading-relaxed max-w-[85%] md:max-w-[75%] shadow-sm",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "bg-card border border-border prose prose-sm dark:prose-invert"
                )}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 md:gap-6"
              >
                <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="px-6 py-4 rounded-3xl bg-card border border-border max-w-[85%] md:max-w-[75%] shadow-sm">
                  {streamedText ? (
                    <StreamedText text={streamedText} isLoading={isLoading} error={error} emptyMessage="" />
                  ) : (
                    <div className="flex gap-2 items-center h-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-10 bg-gradient-to-t from-background via-background to-transparent z-10">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            
            <div className="relative glass border border-border rounded-[2rem] p-2 flex items-end gap-2 shadow-2xl">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message PathFinder..."
                className="flex-1 min-h-[56px] max-h-[200px] bg-transparent border-none rounded-[1.5rem] focus-visible:ring-0 py-4 px-4 text-base font-medium resize-none custom-scrollbar"
                rows={1}
              />
              <Button
                size="icon"
                disabled={!input.trim() || isLoading}
                onClick={handleSubmit}
                className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            
            <p className="mt-3 text-[10px] text-center font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              Shift + Enter for new line • PathFinder AI can make mistakes
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
