"use client";

import React, { useState, useEffect, useRef } from "react";
import { DebateOrchestrator } from "./_components/debate-orchestrator";
import { Users, Database, ServerCog, ShieldAlert, Send, User, MessageSquare, AlertCircle, PlayCircle, StopCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MultiAgentDebatePage() {
  const [orchestrator] = useState(new DebateOrchestrator());
  const [session, setSession] = useState(null);
  const [argument, setArgument] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  
  const scrollRef = useRef(null);

  const startDebate = () => {
      const topic = "Design a Global Ticketmaster clone handling 1M concurrent requests during a Taylor Swift concert drop.";
      const s = orchestrator.startSession(topic);
      setSession(s);
      setHistory([]);
      
      // Inject opening prompt
      setHistory([{
          sender: 'system',
          role: 'System',
          message: `The board has requested your architecture for the Global Ticketmaster clone. You are the Lead Architect. Defend your choices against the DBA, DevOps Engineer, and Security Auditor.`,
          timestamp: Date.now()
      }]);
  };

  const endDebate = () => {
      orchestrator.endSession();
      setSession(null);
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!argument.trim() || isProcessing) return;

      const currentArg = argument;
      setArgument("");
      setIsProcessing(true);

      // Optimistically add user message
      setHistory(prev => [...prev, {
          sender: 'user',
          role: 'Lead Architect',
          message: currentArg,
          timestamp: Date.now()
      }]);

      try {
          const responses = await orchestrator.submitArgument(currentArg);
          
          const newMessages = responses.map(r => ({
              sender: 'agent',
              role: r.role,
              message: r.response,
              timestamp: Date.now()
          }));

          setHistory(prev => [...prev, ...newMessages]);
      } catch (err) {
          alert(err.message);
      } finally {
          setIsProcessing(false);
      }
  };

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [history]);

  const getRoleIcon = (role) => {
      switch(role) {
          case 'Database Administrator': return <Database className="w-5 h-5 text-blue-500" />;
          case 'DevOps Engineer': return <ServerCog className="w-5 h-5 text-orange-500" />;
          case 'Security Auditor': return <ShieldAlert className="w-5 h-5 text-red-500" />;
          case 'Lead Architect': return <User className="w-5 h-5 text-green-500" />;
          default: return <MessageSquare className="w-5 h-5 text-muted-foreground" />;
      }
  };

  const getRoleColor = (role) => {
      switch(role) {
          case 'Database Administrator': return "border-blue-500/30 bg-blue-500/5";
          case 'DevOps Engineer': return "border-orange-500/30 bg-orange-500/5";
          case 'Security Auditor': return "border-red-500/30 bg-red-500/5";
          case 'Lead Architect': return "border-green-500/30 bg-green-500/5";
          default: return "border-muted bg-muted/10";
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10 text-rose-500" />
            System Design Arena
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Defend your architecture against dissenting AI stakeholders in real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-rose-500/20 shadow-lg shadow-rose-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" /> Stakeholders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 pt-6">
                
                {orchestrator.agents.map(agent => (
                    <div key={agent.id} className="p-3 border rounded-xl bg-background flex gap-3 items-start">
                        <div className="mt-1">
                            {getRoleIcon(agent.role)}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">{agent.role}</h4>
                            <p className="text-xs text-muted-foreground mt-1">Focuses on: {agent.focus}</p>
                        </div>
                    </div>
                ))}

                {!session ? (
                    <Button 
                        size="lg" 
                        onClick={startDebate} 
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white gap-2 transition-all shadow-md mt-4 h-14"
                    >
                        <PlayCircle className="w-5 h-5" /> Start Interview Session
                    </Button>
                ) : (
                    <Button 
                        size="lg" 
                        variant="destructive"
                        onClick={endDebate} 
                        className="w-full gap-2 transition-all shadow-md mt-4 h-14"
                    >
                        <StopCircle className="w-5 h-5" /> End Session
                    </Button>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
            <Card className="h-[700px] border-dashed flex flex-col relative overflow-hidden bg-[#fafafa] dark:bg-[#121212]">
                <CardHeader className="bg-background/80 backdrop-blur border-b absolute top-0 w-full z-10">
                    <CardTitle className="text-base flex items-center gap-2">
                        {session ? <span className="flex items-center gap-2 text-rose-500"><div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div> Live Debate: {session.topic}</span> : "Waiting for session..."}
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-auto p-6 pt-24 pb-24 space-y-6 custom-scrollbar" ref={scrollRef}>
                    {!session && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Users className="w-16 h-16 mb-4" />
                            <p>Click "Start Interview Session" to begin the debate.</p>
                        </div>
                    )}

                    {history.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 animate-in slide-in-from-bottom-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender !== 'user' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background border shadow-sm flex items-center justify-center">
                                    {getRoleIcon(msg.role)}
                                </div>
                            )}
                            
                            <div className={`max-w-[80%] rounded-2xl p-4 border ${getRoleColor(msg.role)} ${msg.sender === 'user' ? 'shadow-md rounded-br-none' : 'rounded-tl-none shadow-sm'}`}>
                                <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                                    {msg.role}
                                </div>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </div>

                            {msg.sender === 'user' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 text-white shadow-md flex items-center justify-center">
                                    {getRoleIcon(msg.role)}
                                </div>
                            )}
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="flex gap-4 animate-in fade-in">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background border shadow-sm flex items-center justify-center">
                                <Users className="w-5 h-5 text-muted-foreground animate-pulse" />
                            </div>
                            <div className="bg-muted/30 border rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                </CardContent>

                <div className="absolute bottom-0 w-full p-4 bg-background/80 backdrop-blur border-t">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input 
                            type="text"
                            className="flex-1 bg-background border rounded-full px-6 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-inner"
                            placeholder="Defend your architecture (e.g. 'I will use PostgreSQL and scale vertically...')"
                            value={argument}
                            onChange={(e) => setArgument(e.target.value)}
                            disabled={!session || isProcessing}
                        />
                        <Button 
                            type="submit" 
                            disabled={!session || isProcessing || !argument.trim()}
                            className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-rose-600 hover:bg-rose-700"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
