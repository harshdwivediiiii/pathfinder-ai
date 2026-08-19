"use client";

import React, { useState } from "react";
import { EdgeWebLLMSimulator } from "./_components/webllm-simulator";
import { Cpu, Zap, CloudOff, ServerOff, PlayCircle, Loader2, Target, CheckCircle2, CloudLightning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EdgeQuizPage() {
  const [engine] = useState(new EdgeWebLLMSimulator());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  
  const [topic, setTopic] = useState("React Server Components");
  const [difficulty, setDifficulty] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);

  const handleLoadModel = async () => {
      setIsLoadingModel(true);
      try {
          await engine.loadModel();
          setIsLoaded(true);
      } catch (e) {
          console.error(e);
          alert("Failed to load model.");
      } finally {
          setIsLoadingModel(false);
      }
  };

  const handleGenerate = async () => {
      setIsGenerating(true);
      setQuiz(null);

      try {
          // Pass a simulated "previous mistake" to demonstrate personalization
          const generatedQuiz = await engine.generateQuiz(topic, difficulty, ["hydration errors"]);
          setQuiz(generatedQuiz);
      } catch (e) {
          console.error(e);
          alert(e.message);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Cpu className="w-10 h-10 text-fuchsia-500" />
            Edge-Computed Quiz Generation
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Zero-latency, zero-cost personalized assessments running directly on your local GPU via WebLLM.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-fuchsia-500/10 border border-fuchsia-500/30 p-3 rounded-xl shadow-inner min-w-[250px]">
            <div className="flex items-center justify-center w-10 h-10 bg-fuchsia-500 rounded-full text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                {isLoaded ? <Zap className="w-5 h-5" /> : <ServerOff className="w-5 h-5" />}
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Engine Status</p>
                <p className={`text-sm font-bold ${isLoaded ? 'text-fuchsia-600' : 'text-muted-foreground'}`}>
                    {isLoadingModel ? 'Caching Weights...' : isLoaded ? 'WebGPU Ready' : 'Uninitialized'}
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CONTROL PANEL */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-fuchsia-500/20 shadow-lg shadow-fuchsia-500/5 h-full flex flex-col">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-fuchsia-500" /> Assessment Config
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                
                {!isLoaded ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <CloudOff className="w-12 h-12 text-muted-foreground opacity-50" />
                        <div>
                            <h3 className="font-bold">Model Not Loaded</h3>
                            <p className="text-sm text-muted-foreground mt-1">Download Llama-3-8B into browser cache to enable local inference.</p>
                        </div>
                        <Button 
                            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 mt-4" 
                            onClick={handleLoadModel}
                            disabled={isLoadingModel}
                        >
                            {isLoadingModel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudLightning className="w-4 h-4 mr-2" />}
                            {isLoadingModel ? "Downloading..." : "Initialize WebLLM"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-left-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Topic</label>
                            <input 
                                type="text"
                                className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Difficulty</label>
                            <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg text-xs text-fuchsia-700 dark:text-fuchsia-400 mt-4">
                            <strong>Context Injected:</strong> The engine will automatically generate questions targeting your previous struggle with "hydration errors".
                        </div>

                        <Button 
                            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 shadow-md mt-6 h-12"
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic}
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <PlayCircle className="w-5 h-5 mr-2" />}
                            {isGenerating ? "Inferencing locally..." : "Generate Quiz"}
                        </Button>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* OUTPUT PANEL */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="h-full border-dashed flex flex-col bg-secondary/10 overflow-hidden relative">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-fuchsia-500" />
                        Generated Quiz Output
                    </CardTitle>
                    <CardDescription>Rendered instantaneously via client-side compute</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-6 overflow-auto custom-scrollbar">
                    
                    {!quiz && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Cpu className="w-16 h-16 mb-4" />
                            <p>Configure and generate a quiz to see local inference output.</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-fuchsia-500">
                            <Cpu className="w-16 h-16 mb-4 animate-pulse" />
                            <p className="font-mono text-sm animate-pulse">WebGPU calculating tensor operations...</p>
                        </div>
                    )}

                    {quiz && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                            <div className="flex justify-between items-center bg-background border p-4 rounded-xl shadow-sm">
                                <div>
                                    <h3 className="font-bold text-lg">{quiz.topic} Assessment</h3>
                                    <p className="text-xs text-muted-foreground uppercase mt-1">{quiz.difficulty} Mode</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-1 rounded-full text-xs font-bold">
                                        <CheckCircle2 className="w-3 h-3" /> {quiz.computeSource}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{quiz.tokensGenerated} tokens generated</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {quiz.questions.map((q, idx) => (
                                    <div key={q.id} className="p-5 bg-background border rounded-xl shadow-sm hover:border-fuchsia-500/30 transition-colors group">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <h4 className="font-semibold text-sm leading-relaxed">{q.question}</h4>
                                        </div>
                                        
                                        <div className="pl-9 space-y-2">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className={`p-3 border rounded-lg text-sm ${oIdx === q.correctIndex ? 'border-green-500/50 bg-green-500/5' : 'bg-muted/30'}`}>
                                                    {opt}
                                                    {oIdx === q.correctIndex && <span className="float-right text-xs text-green-600 font-bold">✓ Correct</span>}
                                                </div>
                                            ))}
                                            
                                            <div className="mt-4 p-3 bg-fuchsia-50/50 dark:bg-fuchsia-900/10 rounded-lg text-xs italic text-muted-foreground">
                                                <strong>AI Reasoning:</strong> {q.explanation}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
