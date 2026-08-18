"use client";

import React, { useState, useEffect } from "react";
import { generateMockQuestion, evaluateAnswer } from "./_components/interview-algorithm";
import { Bot, User, CheckCircle2, XCircle, BrainCircuit, Play, Send, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function MockInterviewPage() {
  const [profile, setProfile] = useState(['react', 'node']);
  const [sessionState, setSessionState] = useState('idle'); // idle, questioning, evaluated
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);

  const startInterview = (skills) => {
      setProfile(skills);
      const questionData = generateMockQuestion(skills);
      setCurrentQuestion(questionData);
      setSessionState('questioning');
      setUserAnswer("");
      setEvaluation(null);
  };

  const submitAnswer = () => {
      if (!currentQuestion) return;
      
      const evalResult = evaluateAnswer(userAnswer, currentQuestion.expectedKeywords);
      setEvaluation(evalResult);
      setSessionState('evaluated');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <BrainCircuit className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generative AI Mock Interview</h1>
          <p className="text-muted-foreground">Context-aware LLM simulation that rigorously tests your readiness based on your specific learning path.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Profile Selection */}
        <div className="space-y-6">
          <Card className="border-indigo-500/20 shadow-sm h-full">
            <CardHeader className="bg-indigo-50 dark:bg-indigo-950/20 pb-4 border-b border-indigo-100 dark:border-indigo-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                 <User className="w-5 h-5 text-indigo-500" />
                 Simulated Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <p className="text-sm text-muted-foreground mb-4">Select a completed pathway to generate a targeted technical question.</p>
              
              <Button 
                variant={profile.includes('react') ? "default" : "outline"} 
                className={`w-full justify-start ${profile.includes('react') ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                onClick={() => startInterview(['react', 'node'])}
              >
                <ChevronRight className="w-4 h-4 mr-2" /> Fullstack (React/Node)
              </Button>
              
              <Button 
                variant={profile.includes('python') ? "default" : "outline"} 
                className={`w-full justify-start ${profile.includes('python') ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                onClick={() => startInterview(['python', 'ml'])}
              >
                <ChevronRight className="w-4 h-4 mr-2" /> Data Science (Python/ML)
              </Button>
              
              <Button 
                variant={profile.includes('aws') ? "default" : "outline"} 
                className={`w-full justify-start ${profile.includes('aws') ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                onClick={() => startInterview(['aws', 'docker'])}
              >
                <ChevronRight className="w-4 h-4 mr-2" /> Cloud DevOps (AWS/Docker)
              </Button>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content: Chat Interface */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border shadow-sm flex flex-col min-h-[600px]">
            
            {sessionState === 'idle' ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Bot className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Ready for your interview?</h2>
                    <p className="text-muted-foreground max-w-md">
                        Select a profile on the left to begin. The AI will generate a complex, multi-part question tailored to the exact technologies you studied.
                    </p>
                </div>
            ) : (
                <>
                    <CardHeader className="border-b bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center gap-2">
                             <Bot className="w-5 h-5 text-indigo-500" /> AI Technical Recruiter
                          </CardTitle>
                          <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30">
                              Context: {currentQuestion?.context}
                          </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-grow p-6 space-y-6 overflow-y-auto">
                        
                        {/* AI Question */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 shrink-0 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-sm text-sm md:text-base text-slate-700 dark:text-slate-300">
                                {currentQuestion?.question}
                            </div>
                        </div>
                        
                        {/* User Answer Area */}
                        {sessionState === 'questioning' && (
                            <div className="flex gap-4 flex-row-reverse animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-8 h-8 shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="w-full max-w-2xl">
                                    <Textarea 
                                        placeholder="Type your technical response here. Be specific about methodologies, tools, and architecture..."
                                        className="min-h-[150px] resize-none"
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Button onClick={submitAnswer} className="bg-indigo-600 hover:bg-indigo-700">
                                            <Send className="w-4 h-4 mr-2" /> Submit Answer
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* User Submitted Answer (Read Only) */}
                        {sessionState === 'evaluated' && (
                            <div className="flex gap-4 flex-row-reverse">
                                <div className="w-8 h-8 shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm text-sm md:text-base max-w-2xl whitespace-pre-wrap">
                                    {userAnswer}
                                </div>
                            </div>
                        )}
                        
                        {/* AI Evaluation */}
                        {sessionState === 'evaluated' && evaluation && (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-8 h-8 shrink-0 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                                    <BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-4 rounded-2xl rounded-tl-sm w-full max-w-2xl space-y-4">
                                    
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-emerald-800 dark:text-emerald-400">AI Evaluation Report</h4>
                                        <div className={`text-xl font-bold ${evaluation.score >= 70 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                            Score: {evaluation.score}/100
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        {evaluation.feedback}
                                    </p>
                                    
                                    <div className="space-y-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                                        <span className="text-xs font-semibold text-slate-500">Semantic Keyword Hits:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {currentQuestion?.expectedKeywords.map(kw => (
                                                <Badge 
                                                    key={kw} 
                                                    variant={evaluation.matchedKeywords.includes(kw) ? "default" : "outline"}
                                                    className={evaluation.matchedKeywords.includes(kw) ? "bg-emerald-500 hover:bg-emerald-600" : "text-slate-400 border-slate-200 dark:border-slate-700"}
                                                >
                                                    {evaluation.matchedKeywords.includes(kw) ? <CheckCircle2 className="w-3 h-3 mr-1"/> : <XCircle className="w-3 h-3 mr-1"/>}
                                                    {kw}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </CardContent>
                </>
            )}
            
          </Card>
        </div>
      </div>
    </div>
  );
}
