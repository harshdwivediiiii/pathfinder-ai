"use client";

import React, { useState } from "react";
import { analyzeSentiment } from "./_components/sentiment-algorithm";
import { Brain, FileText, Send, SmilePlus, Frown, MessageSquare, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SentimentAnalysisPage() {
  const [journalEntry, setJournalEntry] = useState("I spent 4 hours on the React Hooks module today. It was really frustrating and confusing at first, but finally I understood how useEffect works! Still struggling a bit with custom hooks though.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
      setIsAnalyzing(true);
      setResult(null);
      
      // Simulate NLP model inference time
      setTimeout(() => {
          const outcome = analyzeSentiment(journalEntry);
          setResult(outcome);
          setIsAnalyzing(false);
      }, 1500);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-xl">
          <MessageSquare className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Sentiment Analysis</h1>
          <p className="text-muted-foreground">Utilize NLP to extract qualitative emotional data from daily learning journals to flag curriculum pain points.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Left Column: User Journal Input */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <FileText className="w-5 h-5 text-fuchsia-500" />
                 Daily Reflection Journal
              </CardTitle>
              <CardDescription>Module: React Hooks (Intermediate)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col space-y-4">
               
               <p className="text-sm text-muted-foreground">How did you feel about today's learning content?</p>
               
               <Textarea 
                   value={journalEntry}
                   onChange={(e) => setJournalEntry(e.target.value)}
                   className="flex-grow min-h-[250px] resize-none text-base p-4 leading-relaxed bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-fuchsia-500"
               />
               
               <Button 
                   onClick={handleAnalyze} 
                   disabled={isAnalyzing || !journalEntry.trim()}
                   className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white h-12"
               >
                   {isAnalyzing ? (
                       <>
                           <Brain className="w-5 h-5 mr-2 animate-pulse" /> Running NLP Inference...
                       </>
                   ) : (
                       <>
                           <Send className="w-5 h-5 mr-2" /> Submit Journal
                       </>
                   )}
               </Button>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: NLP Admin Dashboard */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Activity className="w-5 h-5 text-emerald-400" />
                 Admin Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-slate-400">Qualitative content review metrics.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              
              {!result && !isAnalyzing && (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                      <Brain className="w-12 h-12 mb-4 opacity-50" />
                      <p>Awaiting journal submission...</p>
                  </div>
              )}
              
              {isAnalyzing && (
                  <div className="text-center text-fuchsia-400 flex flex-col items-center animate-pulse">
                      <Brain className="w-12 h-12 mb-4" />
                      <p>Tokenizing text and mapping sentiment vectors...</p>
                  </div>
              )}
              
              {result && !isAnalyzing && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                      
                      {/* Score Visualization */}
                      <div className="flex flex-col items-center justify-center space-y-4">
                          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center flex-col shadow-lg shadow-black/50
                              ${result.category === 'Frustrated' ? 'border-rose-500 bg-rose-500/10 text-rose-400' : 
                                result.category === 'Satisfied' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 
                                'border-amber-500 bg-amber-500/10 text-amber-400'}`}>
                              
                              {result.category === 'Frustrated' ? <Frown className="w-10 h-10 mb-1" /> : 
                               result.category === 'Satisfied' ? <SmilePlus className="w-10 h-10 mb-1" /> : 
                               <MessageSquare className="w-10 h-10 mb-1" />}
                               
                              <span className="text-2xl font-black">{result.score}</span>
                          </div>
                          <div className="text-center">
                              <h3 className="text-xl font-bold uppercase tracking-widest">{result.category}</h3>
                              <p className="text-slate-400 text-sm">Compound NLP Sentiment Score (-1.0 to 1.0)</p>
                          </div>
                      </div>
                      
                      {/* Flagged Pain Points */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                          <h4 className="font-semibold text-slate-300 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500" /> Extracted Emotional Keywords
                          </h4>
                          
                          {result.flags.length === 0 ? (
                              <p className="text-sm text-slate-500">No strong emotional vectors detected.</p>
                          ) : (
                              <div className="flex flex-wrap gap-2">
                                  {result.flags.map((flag, idx) => (
                                      <Badge 
                                          key={idx} 
                                          variant="outline" 
                                          className={`text-sm px-3 py-1 ${flag.type === 'negative' 
                                              ? 'border-rose-900 bg-rose-950/50 text-rose-400' 
                                              : 'border-emerald-900 bg-emerald-950/50 text-emerald-400'}`}
                                      >
                                          {flag.keyword}
                                      </Badge>
                                  ))}
                              </div>
                          )}
                          
                          {result.category === 'Frustrated' && (
                              <div className="mt-4 p-3 bg-rose-950/30 border border-rose-900 rounded text-sm text-rose-300/80">
                                  <strong>System Alert:</strong> This module has triggered a high frustration index. Consider triggering an automated curriculum review for "React Hooks".
                              </div>
                          )}
                      </div>
                      
                  </div>
              )}
              
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
