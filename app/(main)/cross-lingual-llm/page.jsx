"use client";

import React, { useState } from "react";
import { translatePathwayWithLLM } from "./_components/translation-algorithm";
import { Globe2, Code, Languages, ArrowRight, Loader2, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CrossLingualTranslationPage() {
  const [targetLang, setTargetLang] = useState("es");
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState(null);

  // Mock standard English pathway struct
  const mockPathway = {
      title: "Advanced React",
      modules: [
          {
              id: "m1",
              title: "Advanced React Patterns",
              description: "Learn how to build reusable components.",
              codeSnippet: "const MemoizedComponent = React.memo(MyComponent);"
          },
          {
              id: "m2",
              title: "State Management",
              description: "Learn how to build reusable components.", // Re-used for mock dict
              codeSnippet: "const [state, dispatch] = useReducer(reducer, initialState);"
          }
      ]
  };

  const handleTranslate = () => {
      setIsTranslating(true);
      setResult(null);
      
      // Simulate LLM Context Window Processing
      setTimeout(() => {
          const outcome = translatePathwayWithLLM(mockPathway, targetLang);
          setResult(outcome);
          setIsTranslating(false);
      }, 2500);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Languages className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cross-Lingual Pathway LLM</h1>
          <p className="text-muted-foreground">Dynamically translate full curriculums on-the-fly while strictly preserving executable code blocks.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: English Source */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                 <div className="flex items-center gap-2">
                     <BookOpen className="w-5 h-5 text-slate-500" /> Source Content
                 </div>
                 <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded font-semibold">EN-US</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6">
              
              <div className="space-y-4">
                  {mockPathway.modules.map(mod => (
                      <div key={mod.id} className="p-4 border rounded-lg bg-white dark:bg-slate-950 space-y-3">
                          <div>
                              <h3 className="font-bold text-lg">{mod.title}</h3>
                              <p className="text-slate-500 text-sm">{mod.description}</p>
                          </div>
                          <div className="bg-slate-900 rounded p-3 text-emerald-400 font-mono text-sm overflow-x-auto border border-slate-800">
                              {mod.codeSnippet}
                          </div>
                      </div>
                  ))}
              </div>
              
              <div className="flex gap-2">
                  <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="flex-grow rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                      <option value="es">Spanish (ES)</option>
                      <option value="fr">French (FR)</option>
                      <option value="ja">Japanese (JA)</option>
                  </select>
                  <Button 
                      onClick={handleTranslate} 
                      disabled={isTranslating}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-32"
                  >
                      {isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Translate</>}
                  </Button>
              </div>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: LLM Output */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
              <CardTitle className="text-lg flex items-center justify-between">
                 <div className="flex items-center gap-2">
                     <Globe2 className="w-5 h-5 text-blue-400" /> LLM Output
                 </div>
                 {result && !isTranslating && (
                     <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-1 rounded font-semibold uppercase">
                         {result.targetLanguage}
                     </span>
                 )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              
              {!result && !isTranslating && (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                      <Languages className="w-12 h-12 mb-4 opacity-50" />
                      <p>Select a language and prompt the LLM...</p>
                  </div>
              )}
              
              {isTranslating && (
                  <div className="text-center flex flex-col items-center text-blue-400">
                      <Sparkles className="w-12 h-12 mb-4 animate-pulse" />
                      <p className="animate-pulse text-sm font-mono">Tokenizing context and preserving code blocks...</p>
                  </div>
              )}
              
              {result && !isTranslating && result.error && (
                  <div className="bg-rose-950/40 border border-rose-800 text-rose-400 p-4 rounded-xl text-center">
                      {result.error}
                  </div>
              )}
              
              {result && !isTranslating && result.success && (
                  <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
                      
                      {result.translatedData.modules.map(mod => (
                          <div key={mod.id} className="p-4 border border-slate-800 rounded-lg bg-slate-900 space-y-3 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-1 bg-blue-900/30 border-b border-l border-blue-900/50 rounded-bl text-[10px] font-mono text-blue-400">
                                  Translated
                              </div>
                              <div>
                                  <h3 className="font-bold text-lg text-blue-300">{mod.title}</h3>
                                  <p className="text-slate-400 text-sm">{mod.description}</p>
                              </div>
                              
                              {/* Highlight that code was explicitly NOT translated */}
                              <div className="relative">
                                  <div className="absolute -top-2.5 right-2 bg-emerald-950 text-emerald-400 border border-emerald-900 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 z-10">
                                      <Code className="w-3 h-3" /> Preserved
                                  </div>
                                  <div className="bg-slate-950 rounded p-3 text-emerald-400 font-mono text-sm overflow-x-auto border border-emerald-900/50">
                                      {mod.codeSnippet}
                                  </div>
                              </div>
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
