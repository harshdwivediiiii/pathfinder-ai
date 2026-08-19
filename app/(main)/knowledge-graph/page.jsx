"use client";

import React, { useState } from "react";
import { NLPKnowledgeExtractor } from "./_components/nlp-extractor";
import { Network, FileText, ArrowRight, BrainCircuit, Activity, BookOpen, Download, LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function KnowledgeGraphPage() {
  const [extractor] = useState(new NLPKnowledgeExtractor());
  const [docText, setDocText] = useState("Next.js 15 introduces several key architectural changes. At its core, it heavily utilizes React Server Components to push rendering to the server, improving client performance. It relies on the App Router paradigm for nested routing and layouts. Additionally, the compilation engine has been upgraded; it now bundles with Turbopack for significantly faster local development speeds.");
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [graph, setGraph] = useState(null);
  const [curriculumDraft, setCurriculumDraft] = useState(null);

  const handleExtract = async () => {
    setIsExtracting(true);
    setGraph(null);
    setCurriculumDraft(null);

    try {
        const result = await extractor.extractGraph(docText);
        setGraph(result);
        setCurriculumDraft(extractor.generateCurriculumDraft());
    } catch (e) {
        console.error(e);
        alert(e.message);
    } finally {
        setIsExtracting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Network className="w-10 h-10 text-orange-500" />
            NLP Knowledge Graph Extraction
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Automatically ingest raw framework documentation and output a structured curriculum pathway.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-orange-500/20 shadow-lg shadow-orange-500/5 h-full flex flex-col">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" /> Input Unstructured Docs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 pt-6 flex-1 flex flex-col">
                <p className="text-xs text-muted-foreground">Paste raw markdown or text from official documentation.</p>
                <textarea 
                    className="w-full bg-background border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none flex-1 custom-scrollbar leading-relaxed min-h-[300px]"
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    placeholder="Paste technical docs here..."
                />

                <Button 
                    size="lg" 
                    onClick={handleExtract} 
                    disabled={isExtracting || docText.length < 20}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 transition-all shadow-md mt-4 h-14"
                >
                    {isExtracting ? <BrainCircuit className="w-5 h-5 animate-pulse" /> : <Network className="w-5 h-5" />}
                    {isExtracting ? "Running NLP Extraction..." : "Extract Knowledge Graph"}
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <Card className="border-dashed bg-secondary/10 relative overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-500" />
                        Semantic Entity Map
                    </CardTitle>
                    <CardDescription>Extracted concepts and relationships</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {!graph && !isExtracting && (
                        <div className="text-center p-12 text-muted-foreground opacity-50">
                            <Network className="w-16 h-16 mx-auto mb-4" />
                            <p>No graph generated yet.</p>
                        </div>
                    )}

                    {isExtracting && (
                        <div className="text-center p-12 text-orange-500">
                            <BrainCircuit className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                            <p className="font-mono text-sm animate-pulse">Parsing syntax trees & resolving entities...</p>
                        </div>
                    )}

                    {graph && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-wrap gap-4 mb-8 justify-center items-center relative min-h-[200px] border rounded-xl bg-background p-8">
                                {/* Visualizing a simple central node tree structure */}
                                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg z-10">
                                    {graph.nodes[0]?.label}
                                    <div className="text-[10px] text-orange-100 font-normal uppercase text-center mt-1">{graph.nodes[0]?.type}</div>
                                </div>

                                <div className="absolute top-20 left-1/2 w-px h-16 bg-muted-foreground/30"></div>

                                <div className="w-full flex justify-between mt-24 gap-4 px-12 relative">
                                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-muted-foreground/30 hidden sm:block"></div>
                                    {graph.edges.map((edge, idx) => {
                                        const target = graph.nodes.find(n => n.id === edge.target);
                                        return (
                                            <div key={edge.id} className="flex flex-col items-center relative flex-1 text-center">
                                                <div className="absolute -top-12 w-px h-12 bg-muted-foreground/30 hidden sm:block"></div>
                                                <div className="text-[9px] font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full mb-3 -mt-6 sm:mt-0 z-10 border shadow-sm">
                                                    {edge.relation}
                                                </div>
                                                <div className="bg-background border-2 border-orange-500/30 px-3 py-2 rounded-lg shadow-sm text-sm font-semibold">
                                                    {target?.label}
                                                    <div className="text-[10px] text-muted-foreground font-normal uppercase mt-0.5">{target?.type}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {curriculumDraft && (
                <Card className="border-orange-500/40 shadow-lg animate-in fade-in duration-700 slide-in-from-bottom-8">
                    <CardHeader className="bg-orange-500/5 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <LayoutTemplate className="w-5 h-5 text-orange-600" />
                                    Draft Curriculum Pathway
                                </CardTitle>
                                <CardDescription className="mt-1">{curriculumDraft.title}</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" className="gap-2 border-orange-500/30 text-orange-600">
                                <Download className="w-4 h-4"/> Export JSON
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {curriculumDraft.modules.map((mod, idx) => (
                                <div key={mod.moduleId} className="flex gap-4 p-4 border rounded-xl bg-background hover:border-orange-500/50 transition-colors group cursor-pointer">
                                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500/10 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground group-hover:text-orange-600 transition-colors">{mod.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>
                                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-secondary text-secondary-foreground">
                                            {mod.type} Module
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
