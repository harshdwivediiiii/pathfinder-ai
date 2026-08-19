"use client";

import React, { useState } from "react";
import { PodcastSynthesizer } from "./_components/audio-generator";
import { Headphones, Mic2, PlayCircle, PauseCircle, FastForward, Rewind, Volume2, Waves, FileText, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AudioPodcastsPage() {
  const [synthesizer] = useState(new PodcastSynthesizer());
  const [voice, setVoice] = useState('v_alex');
  const [moduleText, setModuleText] = useState("React Server Components (RSC) represent a paradigm shift in how we build React applications. Unlike traditional components that execute on the client, RSCs run exclusively on the server. This allows direct access to backend resources like databases and file systems without requiring an API layer. Furthermore, because they render to a special serialization format instead of raw HTML, they can seamlessly integrate with Client Components, drastically reducing the JavaScript bundle size shipped to the browser.");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [podcast, setPodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSynthesize = async () => {
    setIsGenerating(true);
    setPodcast(null);
    setIsPlaying(false);

    try {
        const result = await synthesizer.generatePodcast(moduleText, voice);
        setPodcast(result);
    } catch (e) {
        console.error(e);
        alert(e.message);
    } finally {
        setIsGenerating(false);
    }
  };

  const togglePlay = () => {
      setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Headphones className="w-10 h-10 text-pink-500" />
            On-the-Go Podcast Summaries
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Synthesize text-heavy curriculum modules into engaging, conversational audio formats.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-pink-500/20 shadow-lg shadow-pink-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Module Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 pt-6">
                <textarea 
                    className="w-full bg-background border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none h-48 custom-scrollbar leading-relaxed"
                    value={moduleText}
                    onChange={(e) => setModuleText(e.target.value)}
                    placeholder="Paste technical curriculum here..."
                />
                
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Voice Persona</label>
                    <div className="grid grid-cols-2 gap-3">
                        {synthesizer.voices.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setVoice(v.id)}
                                className={`flex items-center gap-2 p-3 border rounded-lg text-left transition-all ${voice === v.id ? 'bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-400' : 'bg-muted/30 hover:bg-muted text-muted-foreground'}`}
                            >
                                <Mic2 className="w-4 h-4" />
                                <div>
                                    <div className="font-bold text-sm">{v.name}</div>
                                    <div className="text-[10px] opacity-80">{v.style} style</div>
                                </div>
                                {voice === v.id && <Check className="w-4 h-4 ml-auto" />}
                            </button>
                        ))}
                    </div>
                </div>

                <Button 
                    size="lg" 
                    onClick={handleSynthesize} 
                    disabled={isGenerating || moduleText.length < 50}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white gap-2 transition-all shadow-md mt-4 h-14"
                >
                    {isGenerating ? <Waves className="w-5 h-5 animate-bounce" /> : <Headphones className="w-5 h-5" />}
                    {isGenerating ? "Synthesizing Audio via TTS..." : "Generate Podcast Summary"}
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card className="h-full border-dashed flex flex-col bg-gradient-to-br from-background to-pink-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Waves className="w-5 h-5 text-pink-500" />
                        Audio Player
                    </CardTitle>
                    <CardDescription>Listen to your generated summary</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-8 relative">
                    {!podcast && !isGenerating && (
                        <div className="text-center text-muted-foreground/50">
                            <Headphones className="w-24 h-24 mx-auto mb-4 opacity-20" />
                            <p>Generate a podcast to listen offline.</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="flex flex-col items-center gap-4 text-pink-500">
                            <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="w-2 bg-pink-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 40 + 10}px`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <p className="font-mono text-sm animate-pulse">Running TTS Inference...</p>
                        </div>
                    )}

                    {podcast && (
                        <div className="w-full animate-in zoom-in-95 duration-500 flex flex-col items-center gap-8">
                            <div className="relative w-48 h-48 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 shadow-2xl flex items-center justify-center overflow-hidden">
                                <Waves className={`w-24 h-24 text-white opacity-50 ${isPlaying ? 'animate-pulse' : ''}`} />
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm font-mono">
                                    {podcast.voiceUsed}
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                                    <span>{isPlaying ? "0:14" : "0:00"}</span>
                                    <span>{formatTime(podcast.durationSeconds)}</span>
                                </div>
                                
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden cursor-pointer">
                                    <div className="h-full bg-pink-500 w-0 transition-all duration-1000" style={{ width: isPlaying ? '15%' : '0%' }}></div>
                                </div>

                                <div className="flex items-center justify-center gap-6 pt-2">
                                    <button className="text-muted-foreground hover:text-foreground transition-colors"><Rewind className="w-6 h-6" /></button>
                                    <button onClick={togglePlay} className="text-pink-500 hover:text-pink-600 transition-transform hover:scale-110 active:scale-95">
                                        {isPlaying ? <PauseCircle className="w-16 h-16" /> : <PlayCircle className="w-16 h-16" />}
                                    </button>
                                    <button className="text-muted-foreground hover:text-foreground transition-colors"><FastForward className="w-6 h-6" /></button>
                                </div>
                                <div className="flex justify-center mt-2">
                                     <button className="text-muted-foreground hover:text-foreground transition-colors"><Volume2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="w-full mt-4 p-4 bg-background/80 backdrop-blur-sm border rounded-xl relative">
                                <span className="absolute -top-2 left-4 bg-background px-1 text-[10px] uppercase text-muted-foreground font-bold">Transcript Excerpt</span>
                                <p className="text-sm italic text-muted-foreground leading-relaxed">"{podcast.scriptExcerpt}"</p>
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
