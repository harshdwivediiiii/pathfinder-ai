"use client";

import React, { useState } from "react";
import { Upload, Database, FileText, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function RagCoverLetterEngine() {
  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [generatedLetter, setGeneratedLetter] = useState("");

  const addLog = (msg, delay) => {
    return new Promise(resolve => {
      setTimeout(() => {
        setLogs(prev => [...prev, msg]);
        resolve();
      }, delay);
    });
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;
    
    setStep(2);
    setIsProcessing(true);
    setLogs(["Initializing Local Vector DB (IndexedDB)..."]);
    
    await addLog("Chunking user portfolio and past resume data...", 800);
    await addLog("Generating dense vector embeddings for chunks...", 1000);
    await addLog("Performing semantic search against Job Description...", 1200);
    await addLog("Retrieved top 3 highly-relevant past achievements.", 800);
    await addLog("Injecting context into LLM Prompt via RAG architecture...", 600);
    await addLog("Generating highly-personalized Cover Letter...", 1500);
    
    setGeneratedLetter(`Dear Hiring Manager,

I am writing to express my strong interest in the open position at your company, as outlined in the job description: "${jobDescription.substring(0, 50)}..."

Based on my background, I noticed your focus on scalable systems. At my previous role, I led the migration of a legacy monolithic architecture to a microservices-based system, reducing deployment times by 40% and increasing system uptime to 99.99% (Semantic Match: High).

Furthermore, my experience with modern frontend frameworks aligns perfectly with your requirements for creating responsive user interfaces. I successfully delivered a dashboard application used by over 10,000 daily active users, optimizing React rendering cycles to achieve a 95+ Lighthouse score.

I am excited about the opportunity to bring my technical expertise and problem-solving skills to your engineering team. I look forward to discussing how my background, skills, and certifications can benefit your company.

Sincerely,
[Your Name]`);
    
    setIsProcessing(false);
    setStep(3);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">RAG-Powered Personalization Engine</h2>
        <p className="text-muted-foreground">
          Inject highly specific, fact-based anecdotes from your vector database into generated cover letters.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Step 1: Input */}
        <Card className={`transition-opacity ${step !== 1 && 'opacity-50 pointer-events-none'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              1. Job Details
            </CardTitle>
            <CardDescription>Paste the target job description to match against your vectors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea 
                placeholder="Paste Job Description here..." 
                className="min-h-[200px]"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={!jobDescription.trim()}>
              <Sparkles className="w-4 h-4 mr-2" />
              Start RAG Pipeline
            </Button>
          </CardContent>
        </Card>

        {/* Step 2 & 3: Processing & Output */}
        <Card className="border-primary/20 shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              RAG Execution & Output
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {step === 1 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                <Database className="w-8 h-8 opacity-20" />
                Waiting for input...
              </div>
            )}

            {step >= 2 && (
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs space-y-2 mb-4 h-40 overflow-y-auto border border-border/50">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-primary/80">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {log}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Sparkles className="w-4 h-4" />
                  Generated Cover Letter
                </h4>
                <div className="p-4 bg-card border rounded-xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed">
                  {generatedLetter}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
