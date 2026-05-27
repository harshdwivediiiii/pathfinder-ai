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
import { Card, CardContent } from "@/components/ui/card";
import useStreamFetch from "@/hooks/use-stream-fetch";
import StreamedText, { markdownComponents } from "@/components/streamed-text";
import ReactMarkdown from "react-markdown";

// Helper for formatting time
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMins < 1) {
    return "Just now";
  }
  if (diffInHours < 1) {
    return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  if (diffInDays === 1) {
    return "Yesterday";
  }
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  
  // Search & Preferences
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [saveChatHistory, setSaveChatHistory] = useState(true);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollRef = useRef(null);

  const { streamedText, isLoading, error, startStream, reset } =
    useStreamFetch();

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();

      if (res.ok) {
        setConversations(Array.isArray(data) ? data : data.conversations ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
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
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const createConversation = async (firstMessage) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: firstMessage.slice(0, 50),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setActiveConversationId(data.id);
        setMessages([]);
        await fetchConversations();
        return data.id;
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }

    return null;
  };

  const deleteConversation = async (id) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
        reset();
      }

      fetchConversations();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const clearChatHistory = async () => {
    try {
      await fetch("/api/conversations", {
        method: "DELETE",
      });

      setMessages([]);
      setConversations([]);
      setActiveConversationId(null);
      reset();
    } catch (error) {
      console.error("Clear failed:", error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/user/preferences");
      if (res.ok) {
        const data = await res.json();
        setSaveChatHistory(data.saveChatHistory);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  const handleToggleHistory = async (checked) => {
    setIsUpdatingPreference(true);
    setSaveChatHistory(checked);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveChatHistory: checked }),
      });
      if (!res.ok) {
        setSaveChatHistory(!checked);
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
      setSaveChatHistory(!checked);
    } finally {
      setIsUpdatingPreference(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchPreferences();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/conversations/search?q=${encodeURIComponent(searchTerm.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setConversations(Array.isArray(data.conversations) ? data.conversations : []);
          }
        } catch (error) {
          console.error("Failed to search conversations:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        fetchConversations();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: streamResult.finalText,
        },
      ]);

      reset();
    }
    
    if (saveChatHistory) {
      fetchConversations();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 max-w-7xl">
      <div className="flex gap-4 md:gap-6 h-[calc(100dvh-180px)] min-h-[400px]">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed md:static top-0 bottom-0 left-0 z-50 bg-background/80 backdrop-blur-xl border-r md:border md:border-border/50 md:rounded-2xl flex flex-col
            transition-all duration-300 ease-in-out shadow-2xl md:shadow-sm
            ${
              isSidebarOpen
                ? "translate-x-0 w-80 p-4"
                : "-translate-x-full w-80 md:w-0 md:p-0 md:border-none md:overflow-hidden"
            }
          `}
        >
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h2 className="font-semibold">History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Button
              className="flex-1 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 text-primary shadow-sm transition-all"
              onClick={() => {
                if (isLoading) return;
                setActiveConversationId(null);
                setMessages([]);
                reset();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Chat
            </Button>

            {conversations.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                    title="Clear All History"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your conversations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        if (isLoading) {
                          e.preventDefault();
                          return;
                        }
                        clearChatHistory();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Search Input */}
          <div className="relative mb-4 px-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 rounded-xl border border-border/50 bg-muted/50 pl-9 pr-8 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Privacy Settings */}
          <div className="px-1 mb-4">
            <div className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-3 transition-colors hover:bg-muted/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium text-foreground">Save History</span>
                </div>
                {isLoadingPreferences ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={saveChatHistory}
                    disabled={isUpdatingPreference}
                    onClick={() => handleToggleHistory(!saveChatHistory)}
                    className={`
                      relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed
                      ${saveChatHistory ? 'bg-primary' : 'bg-input hover:bg-muted-foreground/30'}
                    `}
                  >
                    <span
                      aria-hidden="true"
                      className={`
                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out
                        ${saveChatHistory ? 'translate-x-4' : 'translate-x-0'}
                      `}
                    />
                  </button>
                )}
              </div>
              {!saveChatHistory && !isLoadingPreferences && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When disabled, future chats will not be saved.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1 px-2 -mx-2 scrollbar-thin">
            {isLoadingConversations ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 animate-pulse">
                    <div className="h-4 w-4 rounded bg-muted-foreground/20 shrink-0" />
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="h-3.5 w-3/4 rounded bg-muted-foreground/20" />
                      <div className="h-2 w-1/2 rounded bg-muted-foreground/20 ml-6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Start a new chat to begin
                </p>
              </div>
            ) : (
              (Array.isArray(conversations) ? conversations : []).map((conv) => (
                <div
                  key={conv.id}
                  className={`
                    group flex items-center justify-between p-3 rounded-xl transition-all duration-200 ease-in-out cursor-pointer
                    ${
                      activeConversationId === conv.id
                        ? "bg-primary/10 border-l-2 border-primary shadow-sm text-primary"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                    }
                  `}
                  onClick={() => {
                    if (isLoading) return;
                    if (activeConversationId !== conv.id) {
                      loadConversation(conv.id);
                    }
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                >
                  <div className="flex flex-col flex-1 min-w-0 pr-2 gap-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <p className="text-sm font-medium truncate">
                        {conv.title || "New Conversation"}
                      </p>
                    </div>
                    {conv.updatedAt && (
                      <p className="text-[10px] text-muted-foreground/70 pl-6 truncate">
                        {formatTime(conv.updatedAt)}
                      </p>
                    )}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`
                          h-7 w-7 shrink-0 transition-all duration-200
                          ${
                            activeConversationId === conv.id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        title="Delete Conversation"
                      >
                        <Trash2 className="h-4 w-4 hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{conv.title || "this conversation"}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLoading) return;
                            deleteConversation(conv.id);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-4 mb-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-6xl font-bold gradient-title">
                AI Assistant
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Ask anything about your career, resume, or interview prep
              </p>
            </div>
          </div>

          <Card className="flex flex-col h-full bg-background/50 backdrop-blur-sm border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-6 p-6 scrollbar-thin"
            >
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">How can I help you today?</h2>
                  <p className="text-sm max-w-md text-muted-foreground/80 mb-8">
                    Ask questions about your career path, get resume feedback, or start mock interview prep.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                    {[
                      { icon: <FileText className="h-4 w-4" />, title: "Resume Review", desc: "Get feedback on your current resume" },
                      { icon: <Users className="h-4 w-4" />, title: "Interview Prep", desc: "Start a mock interview session" },
                      { icon: <Briefcase className="h-4 w-4" />, title: "Career Advice", desc: "Discuss your career transition" },
                      { icon: <MessageSquare className="h-4 w-4" />, title: "Cover Letter", desc: "Help me write a cover letter" },
                    ].map((suggestion, i) => (
                      <div 
                        key={i} 
                        className="flex flex-col items-start p-3 bg-muted/50 border border-border/50 rounded-xl hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => setInput(suggestion.title)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-primary">{suggestion.icon}</div>
                          <span className="text-sm font-medium text-foreground">{suggestion.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground text-left">{suggestion.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`px-5 py-3.5 max-w-[80%] text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                        : "bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm prose prose-sm dark:prose-invert"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown components={markdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="shrink-0 h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-sm">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>

                  <div className="px-5 py-3.5 max-w-[80%] bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm prose prose-sm dark:prose-invert">
                    {streamedText ? (
                      <StreamedText
                        text={streamedText}
                        isLoading={isLoading}
                        error={error}
                        emptyMessage=""
                      />
                    ) : (
                      <div className="flex gap-1.5 items-center h-5">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="p-4 bg-background/40 backdrop-blur-md border-t border-border/50">
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto relative items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="min-h-[52px] max-h-[200px] resize-none rounded-2xl bg-muted/50 border-border/50 focus-visible:ring-primary/30 pr-12 py-3.5 shadow-sm"
                  rows={1}
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1.5 bottom-1.5 h-10 w-10 rounded-xl transition-all"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
