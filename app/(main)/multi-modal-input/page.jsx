"use client";

import React, { useState } from "react";
import { parseImageInput, parseVoiceInput } from "./_components/multi-modal-algorithm";
import { Mic, Image as ImageIcon, Sparkles, Map, UploadCloud, PlayCircle, Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MultiModalInputPage() {
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' or 'image'
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const mockTranscript = "Uh, hey, so I really want to learn how to build websites, maybe start with HTML and CSS, and then I heard React is really good, and maybe some backend stuff with Node eventually?";
  const mockImageLabels = ["frontend", "javascript", "react", "redux", "api integration"];

  const handleProcessVoice = () => {
      setIsProcessing(true);
      setResult(null);
      
      setTimeout(() => {
          const outcome = parseVoiceInput(mockTranscript);
          setResult(outcome);
          setIsProcessing(false);
      }, 2000);
  };
  
  const handleProcessImage = () => {
      setIsProcessing(true);
      setResult(null);
      
      setTimeout(() => {
          const outcome = parseImageInput(mockImageLabels);
          setResult(outcome);
          setIsProcessing(false);
      }, 2500);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
          <Wand2 className="w-8 h-8 text-pink-600 dark:text-pink-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Modal Pathway Querying</h1>
          <p className="text-muted-foreground">Go beyond text search. Use Vision-Language Models (VLMs) or Audio Parsing to generate customized curriculums.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: Input Selection */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Input Modality</CardTitle>
                  <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                      <button 
                          onClick={() => { setActiveTab('voice'); setResult(null); }}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${activeTab === 'voice' ? 'bg-white dark:bg-slate-700 shadow-sm font-semibold' : 'text-slate-500'}`}
                      >
                          <Mic className="w-4 h-4" /> Voice
                      </button>
                      <button 
                          onClick={() => { setActiveTab('image'); setResult(null); }}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${activeTab === 'image' ? 'bg-white dark:bg-slate-700 shadow-sm font-semibold' : 'text-slate-500'}`}
                      >
                          <ImageIcon className="w-4 h-4" /> Image
                      </button>
                  </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              
              {activeTab === 'voice' && (
                  <div className="space-y-6 animate-in fade-in">
                      <div className="border-2 border-dashed border-pink-200 dark:border-pink-900/30 bg-pink-50 dark:bg-pink-950/10 rounded-xl p-8 text-center flex flex-col items-center">
                          <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/50 rounded-full flex items-center justify-center mb-4 relative">
                              <Mic className="w-8 h-8 text-pink-600 dark:text-pink-400 relative z-10" />
                              {isProcessing && <span className="absolute inset-0 rounded-full border-4 border-pink-400 animate-ping opacity-50"></span>}
                          </div>
                          <h3 className="font-bold mb-2">Voice Note Input</h3>
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border text-left text-sm italic text-muted-foreground w-full relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>
                              "{mockTranscript}"
                          </div>
                      </div>
                      <Button 
                          onClick={handleProcessVoice} 
                          disabled={isProcessing}
                          className="w-full bg-pink-600 hover:bg-pink-700 text-white h-12"
                      >
                          {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Transcribing & Parsing...</> : <><PlayCircle className="w-5 h-5 mr-2" /> Process Voice Input</>}
                      </Button>
                  </div>
              )}
              
              {activeTab === 'image' && (
                  <div className="space-y-6 animate-in fade-in">
                      <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-950/10 rounded-xl p-8 text-center flex flex-col items-center">
                          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                              <ImageIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <h3 className="font-bold mb-2">Image Upload Input</h3>
                          <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center border overflow-hidden relative">
                              <Map className="w-12 h-12 text-slate-400 opacity-50" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent flex items-end justify-center pb-2">
                                  <span className="text-white text-xs font-semibold">roadmap_sketch.jpg</span>
                              </div>
                          </div>
                      </div>
                      <Button 
                          onClick={handleProcessImage} 
                          disabled={isProcessing}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12"
                      >
                          {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Running VLM Inference...</> : <><UploadCloud className="w-5 h-5 mr-2" /> Process Image Input</>}
                      </Button>
                  </div>
              )}
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Output Pathway */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-amber-400" />
                 Generated Pathway
              </CardTitle>
              <CardDescription className="text-slate-400">Structured learning curriculum parsed from input.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              
              {!result && !isProcessing && (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                      <Map className="w-12 h-12 mb-4 opacity-50" />
                      <p>Awaiting input processing...</p>
                  </div>
              )}
              
              {isProcessing && (
                  <div className="text-center flex flex-col items-center text-amber-400">
                      <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mb-4"></div>
                      <p className="animate-pulse">AI is converting unstructured data into a curriculum...</p>
                  </div>
              )}
              
              {result && !isProcessing && result.error && (
                  <div className="bg-rose-950/40 border border-rose-800 text-rose-400 p-4 rounded-xl text-center">
                      {result.error}
                  </div>
              )}
              
              {result && !isProcessing && !result.error && (
                  <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                      
                      <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Source</span>
                          <Badge variant="outline" className="border-amber-700 text-amber-400 bg-amber-950/50">
                              {result.source}
                          </Badge>
                      </div>
                      
                      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                          
                          {result.pathway.map((mod, idx) => (
                              <div key={mod.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-950 bg-amber-500 text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                      <span className="font-bold text-sm">{idx + 1}</span>
                                  </div>
                                  
                                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-800 bg-slate-900 shadow">
                                      <h3 className="font-bold text-slate-200">{mod.title}</h3>
                                      <span className="text-xs text-slate-500 uppercase tracking-wider">{mod.type} node</span>
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
