"use client";

import React, { useState, useEffect } from "react";
import { LocalWasmLLM } from "./_components/wasm-algorithm";
import { Cpu, ShieldAlert, ShieldCheck, Lock, Terminal, Zap, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function WasmLocalLLMsPage() {
  const [llm, setLlm] = useState(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  
  const [isInferencing, setIsInferencing] = useState(false);
  const [result, setResult] = useState(null);

  const [prompt, setPrompt] = useState("How can I optimize this code?");
  const [codeContext, setCodeContext] = useState("function calculate() {\n  // Proprietary Financial Algorithm\n  let sum = 0;\n  for(let i=0; i<1000; i++) {\n    for(let j=0; j<1000; j++) sum++;\n  }\n  return sum;\n}");

  useEffect(() => {
    setLlm(new LocalWasmLLM());
  }, []);

  const handleLoadModel = async () => {
    setIsLoadingModel(true);
    setLoadProgress(0);
    
    const interval = setInterval(() => {
        setLoadProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                return 100;
            }
            return prev + 15;
        });
    }, 150);

    try {
        await llm.loadModel("Llama-3-8B-Q4");
        setIsModelReady(true);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoadingModel(false);
    }
  };

  const handleInference = async () => {
    if (!isModelReady) return;
    setIsInferencing(true);
    setResult(null);

    try {
        const res = await llm.generateResponse(codeContext, prompt);
        setResult(res);
    } catch (e) {
        console.error(e);
    } finally {
        setIsInferencing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Cpu className="w-10 h-10 text-emerald-500" />
            WASM-based Local LLMs
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Privacy-first code tutoring using WebAssembly and WebGPU for entirely offline inference.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/30 px-4 py-2 rounded-full border border-border">
          <Lock className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">Enterprise Privacy Grade</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Proprietary Code Sandbox
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <textarea 
                    className="w-full h-48 bg-[#1e1e1e] text-gray-300 p-6 font-mono text-sm resize-none focus:outline-none rounded-b-xl custom-scrollbar"
                    value={codeContext}
                    onChange={(e) => setCodeContext(e.target.value)}
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>AI Tutor Query</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ask the local LLM a question..."
                />
                
                <Button 
                    size="lg" 
                    onClick={handleInference} 
                    disabled={!isModelReady || isInferencing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all shadow-md hover:shadow-lg"
                >
                {isInferencing ? (
                    <>
                        <Zap className="w-5 h-5 animate-pulse" />
                        Generating Response Locally...
                    </>
                ) : (
                    <>
                        <ShieldCheck className="w-5 h-5" />
                        Submit for Private Analysis
                    </>
                )}
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full border-dashed">
            <CardHeader>
              <CardTitle className="text-xl">Model Status</CardTitle>
              <CardDescription>WebGPU Engine details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!isModelReady ? (
                    <div className="space-y-4">
                        <div className="text-center p-6 bg-muted/50 rounded-lg border">
                            <ShieldAlert className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-4">No model loaded in memory. Cloud APIs are strictly disabled for privacy.</p>
                            <Button onClick={handleLoadModel} disabled={isLoadingModel} variant="outline" className="w-full gap-2">
                                <Download className="w-4 h-4" />
                                {isLoadingModel ? "Allocating VRAM..." : "Load Llama-3-8B-Q4"}
                            </Button>
                        </div>
                        {isLoadingModel && (
                            <div className="space-y-2">
                                <Progress value={loadProgress} className="h-2" />
                                <p className="text-xs text-center text-muted-foreground">Downloading and quantizing weights...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="p-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-500/20">
                            <h4 className="font-semibold text-sm">Model Active</h4>
                            <p className="text-xs mt-1">Allocated 4096MB of VRAM.</p>
                        </div>
                    </div>
                )}

              {result && (
                <div className="space-y-4 animate-in fade-in zoom-in">
                  <div className="p-4 rounded-lg border bg-background">
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Tutor Response:</h4>
                    <p className="text-sm text-foreground">{result.response}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted">
                        <span className="text-muted-foreground block">Tokens/sec</span>
                        <span className="font-semibold text-emerald-600">{result.tokensPerSecond}</span>
                    </div>
                    <div className="p-2 rounded bg-muted">
                        <span className="text-muted-foreground block">Latency</span>
                        <span className="font-semibold text-emerald-600">{result.inferenceTimeMs}ms</span>
                    </div>
                    <div className="col-span-2 p-2 rounded bg-muted">
                        <span className="text-muted-foreground block">Privacy Protocol</span>
                        <span className="font-semibold text-emerald-600 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {result.privacyStatus}
                        </span>
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
