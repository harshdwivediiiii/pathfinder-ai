"use client";

import React, { useState } from "react";
import { generateAutomatedPortfolio } from "./_components/github-llm-algorithm";
import { Github, Sparkles, Code2, Link as LinkIcon, Briefcase, FileText, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PortfolioGenerationPage() {
  const [username, setUsername] = useState("johndoe123");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = (e) => {
      e.preventDefault();
      if (!username.trim()) return;
      
      setIsGenerating(true);
      setResult(null);
      
      // Simulate API fetch + LLM generation delay
      setTimeout(() => {
          const outcome = generateAutomatedPortfolio(username);
          setResult(outcome);
          setIsGenerating(false);
      }, 2500);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Briefcase className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automated Portfolio Generator</h1>
          <p className="text-muted-foreground">Instantly compile GitHub repositories into a professional, LLM-summarized portfolio.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Input Form */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Github className="w-5 h-5 text-indigo-500" />
                 Connect Git Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-4">
              
              <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-sm font-medium">GitHub Username</label>
                      <Input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g., johndoe123"
                      />
                  </div>
                  
                  <Button 
                      type="submit" 
                      disabled={isGenerating}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                      {isGenerating ? (
                          <>
                              <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> Generating with AI...
                          </>
                      ) : (
                          "Compile Portfolio"
                      )}
                  </Button>
              </form>
              
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 rounded-lg text-sm border border-indigo-100 dark:border-indigo-900/30">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1 opacity-80">
                      <li>Fetches all public repositories.</li>
                      <li>Heuristically filters out trivial projects (e.g., empty forks, 'hello-world').</li>
                      <li>Feeds raw code into an LLM to generate employer-ready summaries.</li>
                  </ol>
              </div>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Output Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          
          {!result && !isGenerating && (
              <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
                  <Globe className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                  <p>Your portfolio is waiting.</p>
                  <p className="text-sm">Enter a username to generate a public dashboard.</p>
              </div>
          )}
          
          {isGenerating && (
              <div className="h-full border rounded-xl flex flex-col items-center justify-center p-12 text-center bg-card">
                  <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900 rounded-lg transform rotate-12"></div>
                      <div className="absolute inset-0 border-4 border-indigo-500 rounded-lg animate-pulse"></div>
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analyzing Repositories</h3>
                  <p className="text-sm text-muted-foreground animate-pulse">The LLM is currently reading your code and writing professional summaries...</p>
              </div>
          )}
          
          {result && !isGenerating && result.error && (
              <div className="h-full border border-rose-200 bg-rose-50 dark:bg-rose-950/20 rounded-xl flex items-center justify-center p-6 text-rose-600">
                  {result.error}
              </div>
          )}
          
          {result && !isGenerating && !result.error && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="font-bold text-lg">{result.username}'s Developer Portfolio</h2>
                        <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                            <LinkIcon className="w-3 h-3" />
                            <a href="#" className="hover:underline">{result.publicUrl}</a>
                        </div>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 border-none dark:bg-indigo-900/50 dark:text-indigo-300">
                        {result.projects.length} Highlighted Projects
                    </Badge>
                </div>
                
                {/* Generated Projects List */}
                <div className="grid gap-6">
                    {result.projects.map((project, idx) => (
                        <Card key={idx} className="border shadow-sm overflow-hidden group">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1 w-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <CardContent className="p-0">
                                
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <Code2 className="w-5 h-5 text-indigo-500" />
                                            {project.originalName}
                                        </h3>
                                        <Badge variant="outline" className="font-mono bg-slate-50 dark:bg-slate-900">
                                            {project.language}
                                        </Badge>
                                    </div>
                                    
                                    <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border relative">
                                        <div className="absolute -top-3 left-4 bg-card px-2 text-xs font-semibold text-indigo-500 flex items-center gap-1 border rounded-full">
                                            <Sparkles className="w-3 h-3" /> AI Generated Summary
                                        </div>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap mt-2">
                                            {project.llmGeneratedReadme}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-900 border-t p-3 px-6 flex justify-between items-center text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Auto-synced from GitHub</span>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-indigo-600">View Source</Button>
                                </div>
                                
                            </CardContent>
                        </Card>
                    ))}
                </div>
                
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
