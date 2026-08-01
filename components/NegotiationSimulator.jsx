"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, Briefcase, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function NegotiationSimulator() {
  const [messages, setMessages] = useState([
    {
      role: "hr",
      content: "Hello! Thank you for taking the time to discuss the offer. We are excited to offer you the position with a base salary of $85,000.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [coachAdvice, setCoachAdvice] = useState("They anchored at $85k. Since the market average for your skills is $105k, you should counter by highlighting your unique value and propose $110k.");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI HR Manager Response and Coach Advice via "WebSockets"
    setTimeout(() => {
      const hrResponse = {
        role: "hr",
        content: "I understand where you're coming from. However, our budget for this role is quite strict. We might be able to stretch to $90,000 if we include a signing bonus. How does that sound?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, hrResponse]);
      setIsTyping(false);
      setCoachAdvice("They're budging! The signing bonus is a good sign, but $90k is still low. Try to push for $100k base, or ask for additional equity/benefits to bridge the gap.");
    }, 2500);
  };

  return (
    <div className="flex flex-col md:flex-row h-[85vh] w-full max-w-6xl mx-auto gap-4 p-4">
      {/* Main Negotiation Chat */}
      <Card className="flex-1 flex flex-col shadow-lg border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <CardHeader className="border-b bg-card/50 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Salary Negotiation Simulator
          </CardTitle>
          <p className="text-sm text-muted-foreground">Practice with an AI Hiring Manager</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            <div className="flex flex-col gap-4 pb-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="w-8 h-8">
                    {msg.role === "hr" ? (
                      <div className="bg-primary/10 w-full h-full flex items-center justify-center rounded-full text-primary font-bold">HR</div>
                    ) : (
                      <div className="bg-secondary w-full h-full flex items-center justify-center rounded-full text-secondary-foreground"><User className="w-4 h-4" /></div>
                    )}
                  </Avatar>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none border"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-[10px] opacity-70 mt-1 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-end gap-2">
                  <Avatar className="w-8 h-8">
                    <div className="bg-primary/10 w-full h-full flex items-center justify-center rounded-full text-primary font-bold">HR</div>
                  </Avatar>
                  <div className="bg-muted text-foreground rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center border shadow-sm">
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-3 border-t bg-card/50 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex w-full items-center space-x-2"
          >
            <Input
              type="text"
              placeholder="Type your response..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 rounded-full bg-background"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="rounded-full shadow-md transition-transform hover:scale-105">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>

      {/* AI Coach Sidebar */}
      <Card className="w-full md:w-80 flex flex-col shadow-lg border-green-500/30 bg-gradient-to-b from-card to-green-50/5 dark:to-green-950/20">
        <CardHeader className="border-b border-green-500/20">
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Info className="w-5 h-5" />
            AI Coach Insights
          </CardTitle>
          <p className="text-xs text-muted-foreground">Real-time negotiation strategy</p>
        </CardHeader>
        <CardContent className="flex-1 p-4 flex flex-col gap-4 justify-start pt-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-card border border-green-500/30 rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Advice
              </h4>
              <p className="text-sm leading-relaxed text-foreground/90">
                {coachAdvice}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
            <strong>Tip:</strong> Always anchor your counter-offers on market data rather than personal needs.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
