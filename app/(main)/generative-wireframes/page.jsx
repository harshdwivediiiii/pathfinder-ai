"use client";

import React, { useState } from "react";
import { synthesizeWireframe } from "./_components/wireframe-algorithm";
import { Sparkles, Code2, LayoutTemplate, Copy, CheckCircle2, Download, Braces } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GenerativeWireframePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const sampleSchema = {
    title: "E-Commerce Admin Dashboard",
    endpoints: [
      {
        name: "Get Products List",
        path: "/api/v1/products",
        method: "GET"
      },
      {
        name: "Create New Product",
        path: "/api/v1/products",
        method: "POST",
        payloadSchema: {
          title: "string",
          price: "number",
          category: "string"
        }
      },
      {
        name: "Delete Product",
        path: "/api/v1/products/:id",
        method: "DELETE"
      }
    ]
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setResult(null);

    // Simulate AI generation delay
    setTimeout(() => {
      try {
        const wireframeData = synthesizeWireframe(sampleSchema);
        setResult(wireframeData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }, 1500);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <LayoutTemplate className="w-10 h-10 text-purple-500" />
            Generative UI/UX Wireframes
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Automatically synthesize responsive React/Tailwind frontend code directly from your backend API JSON schema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-purple-500/20 shadow-lg shadow-purple-500/5 h-fit">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <Braces className="w-5 h-5" />
              Input Backend API Schema
            </CardTitle>
            <CardDescription>Provide a JSON representation of your endpoints</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-[#1e1e1e] p-6 font-mono text-sm text-green-400 overflow-x-auto rounded-b-xl">
              <pre className="whitespace-pre-wrap">{JSON.stringify(sampleSchema, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="h-full flex flex-col border-dashed">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    Generated Output
                </CardTitle>
                <CardDescription>Your React/Tailwind wireframe will appear here</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                {isGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                        <Sparkles className="w-12 h-12 text-purple-500 animate-spin" />
                        <p className="text-lg font-medium animate-pulse text-muted-foreground">Synthesizing UI Components...</p>
                    </div>
                ) : result ? (
                    <div className="space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                Successfully generated {result.componentCount} endpoint UI components
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    {copied ? "Copied!" : "Copy Code"}
                                </Button>
                                <Button variant="default" size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700">
                                    <Download className="w-4 h-4" /> Download .tsx
                                </Button>
                            </div>
                        </div>
                        <div className="bg-[#1e1e1e] p-6 font-mono text-xs text-blue-300 rounded-xl overflow-x-auto flex-1 max-h-[400px] custom-scrollbar">
                            <pre>{result.generatedCode}</pre>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <LayoutTemplate className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Click the button below to feed the schema into the diffusion model and generate the frontend wireframe.</p>
                    </div>
                )}
                </CardContent>
            </Card>

            <Button 
                size="lg" 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 transition-all shadow-md hover:shadow-lg h-14 text-lg font-semibold"
            >
                <Sparkles className="w-5 h-5" />
                {isGenerating ? "Synthesizing..." : "Generate Wireframe"}
            </Button>
        </div>
      </div>
    </div>
  );
}
