"use client";

import React, { useState, useEffect } from "react";
import { predictAndCacheNextSteps, evaluateOfflineQuiz } from "./_components/edge-algorithm";
import { Wifi, WifiOff, HardDriveDownload, BrainCircuit, CheckCircle2, AlertCircle, FileText, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function EdgeAiCachingPage() {
  const [isOffline, setIsOffline] = useState(false);
  const [cachedContent, setCachedContent] = useState([]);
  
  // Quiz State
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState(null);
  
  const currentModuleId = 'mod_2'; // "CSS Grid"
  
  // Simulate Service Worker Caching when online
  useEffect(() => {
      if (!isOffline) {
          const predicted = predictAndCacheNextSteps(currentModuleId);
          setCachedContent(predicted);
          setQuizResult(null); // Reset quiz
      }
  }, [isOffline]);

  const handleQuizSubmit = () => {
      // The cached quiz is mod_3: Layout Quiz, requiring keywords: ['display', 'grid', 'columns', 'rows']
      const activeQuiz = cachedContent.find(c => c.type === 'quiz');
      if (activeQuiz) {
          const result = evaluateOfflineQuiz(quizAnswer, activeQuiz.keywords);
          setQuizResult(result);
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <BrainCircuit className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edge AI Offline Caching</h1>
          <p className="text-muted-foreground">PWA Service Workers predictively cache pathways and execute lightweight NLP locally when the network drops.</p>
        </div>
      </div>

      {/* Network Toggle Banner */}
      <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-colors duration-500 ${isOffline ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50'}`}>
          <div className="flex items-center gap-3">
              {isOffline ? (
                  <WifiOff className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-pulse" />
              ) : (
                  <Wifi className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              )}
              <div>
                  <h3 className={`font-bold ${isOffline ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                      {isOffline ? 'System is Offline' : 'System is Online'}
                  </h3>
                  <p className="text-sm opacity-80">Toggle to simulate network connectivity loss.</p>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Network Status</span>
              <Switch checked={!isOffline} onCheckedChange={(checked) => setIsOffline(!checked)} />
          </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Left Column: PWA Cache Status */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                 <div className="flex items-center gap-2">
                     <HardDriveDownload className="w-5 h-5 text-blue-500" />
                     Service Worker Cache
                 </div>
                 {!isOffline && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none animate-pulse">Syncing...</Badge>}
              </CardTitle>
              <CardDescription>Predictively fetching the next 3 steps in the pathway.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                
              {cachedContent.map((item, idx) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-card flex justify-between items-center opacity-100 transition-opacity">
                      <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.type === 'quiz' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                              +{idx + 1}
                          </div>
                          <div>
                              <p className="font-semibold text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                          </div>
                      </div>
                      <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30">
                          Cached
                      </Badge>
                  </div>
              ))}
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Offline AI Evaluation */}
        <div className="space-y-6">
          <Card className={`border shadow-sm h-full transition-all duration-500 ${isOffline ? 'border-amber-400 shadow-amber-500/10' : ''}`}>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <BrainCircuit className={`w-5 h-5 ${isOffline ? 'text-amber-500' : 'text-slate-400'}`} />
                 Edge AI Quiz Evaluator
              </CardTitle>
              <CardDescription>
                  {isOffline 
                    ? "Operating entirely on local device via TensorFlow.js" 
                    : "Ready to take over if connection drops."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               
               <div className="space-y-2">
                   <h4 className="font-bold">Module 3: Layout Quiz</h4>
                   <p className="text-sm text-muted-foreground">Explain how to create a 2-column layout using CSS.</p>
               </div>
               
               <Textarea 
                   value={quizAnswer}
                   onChange={(e) => setQuizAnswer(e.target.value)}
                   placeholder="Type your answer here... (Try mentioning 'display: grid' and 'columns')"
                   className="min-h-[120px] resize-none"
               />
               
               <Button 
                   onClick={handleQuizSubmit}
                   disabled={!quizAnswer.trim()}
                   className="w-full bg-slate-900 text-white hover:bg-slate-800"
               >
                   <Send className="w-4 h-4 mr-2" /> Submit Answer
               </Button>
               
               {quizResult && (
                   <div className={`p-4 mt-4 rounded-lg border ${quizResult.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300'} animate-in fade-in zoom-in-95`}>
                       <div className="flex items-start gap-3">
                           {quizResult.isCorrect ? (
                               <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
                           ) : (
                               <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-600" />
                           )}
                           <div>
                               <h4 className="font-bold text-sm mb-1">
                                   Score: {Math.round(quizResult.score)}% - {quizResult.isCorrect ? 'Passed!' : 'Try Again'}
                               </h4>
                               <p className="text-sm opacity-90">{quizResult.feedback}</p>
                               {isOffline && (
                                   <div className="mt-2 text-xs font-mono opacity-70 flex items-center gap-1">
                                       <BrainCircuit className="w-3 h-3" /> Graded locally by Edge AI (No network request made).
                                   </div>
                               )}
                           </div>
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
