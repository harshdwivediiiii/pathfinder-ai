"use client";

import { useState } from "react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, AlertCircle } from "lucide-react";
import { analyzeSystemDesign } from "@/actions/system-design";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SystemDesignClient() {
  const [editor, setEditor] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const handleGetFeedback = async () => {
    if (!editor) return;
    
    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) {
      setError("The whiteboard is empty. Draw some architecture components first!");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Export canvas to blob
      const svg = await editor.getSvgString(Array.from(editor.getCurrentPageShapeIds()));
      const blob = new Blob([svg], { type: "image/svg+xml" });

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        // Call Server Action
        const result = await analyzeSystemDesign(base64data);
        
        if (result.success) {
          setFeedback(result.analysis);
        } else {
          setError(result.error);
        }
        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error(err);
      setError("Failed to capture whiteboard image. Please try again.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row gap-4 p-4">
      {/* Whiteboard Section */}
      <div className="relative flex-1 rounded-xl border bg-background overflow-hidden shadow-sm">
        <Tldraw 
          onMount={setEditor} 
          inferDarkMode
          className="z-0"
        />
        
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <Button 
            onClick={handleGetFeedback} 
            disabled={isAnalyzing || !editor}
            className="shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Architecture...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Get AI Critique
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="w-full md:w-96 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>AI Critique</CardTitle>
            <CardDescription>
              Draw your system architecture and request feedback to simulate a system design interview.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              {error && (
                <div className="bg-destructive/15 text-destructive border-destructive/50 border p-4 rounded-md mb-4 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <h5 className="font-medium mb-1">Error</h5>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {!feedback && !error && !isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4 mt-20">
                  <Wand2 className="h-12 w-12 opacity-20" />
                  <p>Your feedback will appear here after the AI analyzes your diagram.</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-8 space-y-4 mt-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="animate-pulse">Thinking about scalability...</p>
                </div>
              )}

              {feedback && !isAnalyzing && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">{feedback.summary}</p>
                  </div>

                  {feedback.bottlenecks?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Potential Bottlenecks
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {feedback.bottlenecks.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.suggestions?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        Suggested Improvements
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {feedback.suggestions.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-muted p-4 rounded-lg border">
                    <h3 className="font-semibold mb-1">Overall Feedback</h3>
                    <p className="text-sm text-muted-foreground italic">"{feedback.overallFeedback}"</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
