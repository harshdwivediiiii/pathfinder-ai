"use client";

import React, { useState } from "react";
import { EthicalAILinter } from "./_components/ethical-linter";
import { Scale, AlertTriangle, Code, PlayCircle, ShieldCheck, BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BiasDetectionPage() {
  const [linter] = useState(new EthicalAILinter());
  
  const initialCode = `function filterApplicants(applicants) {
    return applicants.filter(candidate => {
        // Must have good credit
        if (candidate.credit_score < 650) return false;
        
        // Cannot have large resume gaps
        if (candidate.gap_in_resume > 6) return false;
        
        // Filter out specific demographics for "culture fit"
        if (candidate.gender === 'Female' && candidate.age > 45) return false;
        
        return true;
    });
}`;

  const [code, setCode] = useState(initialCode);
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState(null);

  const handleScan = async () => {
      setIsScanning(true);
      setReport(null);

      try {
          const result = await linter.scanCode(code);
          setReport(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsScanning(false);
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Scale className="w-10 h-10 text-violet-500" />
            Ethical AI Linter
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Detect subconscious demographic and gender bias in your algorithmic logic.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CODE EDITOR */}
        <div className="space-y-6 flex flex-col h-full">
          <Card className="border-violet-500/20 shadow-lg shadow-violet-500/5 flex-1 flex flex-col">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-violet-500" /> Capstone Code Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col relative">
                <textarea 
                    className="w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono p-6 text-sm focus:outline-none resize-none flex-1 custom-scrollbar leading-relaxed min-h-[400px]"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck="false"
                />
                
                <div className="p-4 border-t bg-background">
                    <Button 
                        size="lg" 
                        onClick={handleScan} 
                        disabled={isScanning || !code.trim()}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2 transition-all shadow-md"
                    >
                        {isScanning ? <Scale className="w-5 h-5 animate-pulse" /> : <PlayCircle className="w-5 h-5" />}
                        {isScanning ? "Analyzing AST for Disparate Impact..." : "Run Ethical Linter"}
                    </Button>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* LINTER REPORT */}
        <div className="space-y-6 h-full flex flex-col">
            <Card className="border-dashed bg-secondary/10 flex-1 overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-violet-500" />
                        Linting Report
                    </CardTitle>
                    <CardDescription>NLP-driven demographic bias analysis</CardDescription>
                </CardHeader>
                <CardContent className="p-6 overflow-auto max-h-[500px] custom-scrollbar">
                    {!report && !isScanning && (
                        <div className="text-center p-12 text-muted-foreground opacity-50 h-full flex flex-col items-center justify-center">
                            <Scale className="w-16 h-16 mb-4" />
                            <p>Run the linter to evaluate your logic.</p>
                        </div>
                    )}

                    {isScanning && (
                        <div className="text-center p-12 text-violet-500 h-full flex flex-col items-center justify-center">
                            <Scale className="w-16 h-16 mb-4 animate-bounce" />
                            <p className="font-mono text-sm animate-pulse">Scanning Abstract Syntax Tree...</p>
                        </div>
                    )}

                    {report && report.passed && (
                        <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center animate-in slide-in-from-right-4">
                            <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <h3 className="font-bold text-green-700 dark:text-green-400 text-lg">Logic Passed</h3>
                            <p className="text-green-600/80 text-sm mt-1">No explicit demographic biases detected in the AST.</p>
                        </div>
                    )}

                    {report && !report.passed && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            {report.requiresIntervention && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-bold text-red-600">Intervention Required</h3>
                                            <p className="text-sm text-red-600/80 mt-1">
                                                Your code contains logic that mathematically guarantees disparate impact against protected classes.
                                            </p>
                                            <Button variant="outline" className="mt-3 bg-white dark:bg-background border-red-500/30 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 text-xs">
                                                <BookOpen className="w-3 h-3 mr-2"/> Launch Ethics Micro-Module <ChevronRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {report.violations.map((v, idx) => (
                                <div key={idx} className="p-4 bg-background border rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${v.severity === 'Critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                                {v.severity}
                                            </span>
                                            <span className="text-sm font-bold">{v.type}</span>
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">Line {v.line}</span>
                                    </div>
                                    <div className="bg-muted p-2 rounded text-xs font-mono text-foreground mb-3 overflow-x-auto whitespace-nowrap">
                                        {v.codeSnippet}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {v.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
