"use client";

import React, { useState, useEffect, useRef } from "react";
import { Music, Play, Pause, RefreshCw, BarChart2, Radio, CheckCircle, HelpCircle, Layers, Volume2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TRACKS = [
  {
    id: 1,
    title: "Nextjs Client Components Lifecycle Ep 1",
    duration: "10 mins",
    description: "Architectural tradeoffs of client-rendered interactive pages vs server components.",
    transcript: [
        { time: 0, speaker: 'Host', text: "Welcome to PathFinder Podcasts. Today we dissect React Server Components." },
        { time: 10, speaker: 'Guest', text: "Server components reduce bundle sizes because they are computed entirely on the server side." },
        { time: 25, speaker: 'Host', text: "But what if we need state interactions? Can we mix them? Client components solve that." },
      ]
  },
  {
    id: 2,
    title: "Distributed Cache Strategies Ep 1",
    duration: "15 mins",
    description: "How Redis handles partition failures and locks using Redlock algorithms.",
    transcript: [
        { time: 0, speaker: 'Host', text: "In high scale applications, databases become bottlenecks. Let's discuss Redis caching." },
        { time: 12, speaker: 'Guest', text: "Caching keys with sensible time-to-live is vital. Redlock helps coordinate consensus distributed locks." },
      ]
  },
  {
    id: 3,
    title: "Nextjs Client Components Lifecycle Ep 2",
    duration: "10 mins",
    description: "Architectural tradeoffs of client-rendered interactive pages vs server components.",
    transcript: [
        { time: 0, speaker: 'Host', text: "Welcome to PathFinder Podcasts. Today we dissect React Server Components." },
        { time: 10, speaker: 'Guest', text: "Server components reduce bundle sizes because they are computed entirely on the server side." },
        { time: 25, speaker: 'Host', text: "But what if we need state interactions? Can we mix them? Client components solve that." },
      ]
  },
  {
    id: 4,
    title: "Distributed Cache Strategies Ep 2",
    duration: "15 mins",
    description: "How Redis handles partition failures and locks using Redlock algorithms.",
    transcript: [
        { time: 0, speaker: 'Host', text: "In high scale applications, databases become bottlenecks. Let's discuss Redis caching." },
        { time: 12, speaker: 'Guest', text: "Caching keys with sensible time-to-live is vital. Redlock helps coordinate consensus distributed locks." },
      ]
  },
  {
    id: 5,
    title: "Nextjs Client Components Lifecycle Ep 3",
    duration: "10 mins",
    description: "Architectural tradeoffs of client-rendered interactive pages vs server components.",
    transcript: [
        { time: 0, speaker: 'Host', text: "Welcome to PathFinder Podcasts. Today we dissect React Server Components." },
        { time: 10, speaker: 'Guest', text: "Server components reduce bundle sizes because they are computed entirely on the server side." },
        { time: 25, speaker: 'Host', text: "But what if we need state interactions? Can we mix them? Client components solve that." },
      ]
  },
  {
    id: 6,
    title: "Distributed Cache Strategies Ep 3",
    duration: "15 mins",
    description: "How Redis handles partition failures and locks using Redlock algorithms.",
    transcript: [
        { time: 0, speaker: 'Host', text: "In high scale applications, databases become bottlenecks. Let's discuss Redis caching." },
        { time: 12, speaker: 'Guest', text: "Caching keys with sensible time-to-live is vital. Redlock helps coordinate consensus distributed locks." },
      ]
  },
  {
    id: 7,
    title: "Nextjs Client Components Lifecycle Ep 4",
    duration: "10 mins",
    description: "Architectural tradeoffs of client-rendered interactive pages vs server components.",
    transcript: [
        { time: 0, speaker: 'Host', text: "Welcome to PathFinder Podcasts. Today we dissect React Server Components." },
        { time: 10, speaker: 'Guest', text: "Server components reduce bundle sizes because they are computed entirely on the server side." },
        { time: 25, speaker: 'Host', text: "But what if we need state interactions? Can we mix them? Client components solve that." },
      ]
  },
  {
    id: 8,
    title: "Distributed Cache Strategies Ep 4",
    duration: "15 mins",
    description: "How Redis handles partition failures and locks using Redlock algorithms.",
    transcript: [
        { time: 0, speaker: 'Host', text: "In high scale applications, databases become bottlenecks. Let's discuss Redis caching." },
        { time: 12, speaker: 'Guest', text: "Caching keys with sensible time-to-live is vital. Redlock helps coordinate consensus distributed locks." },
      ]
  },
  {
    id: 9,
    title: "Nextjs Client Components Lifecycle Ep 5",
    duration: "10 mins",
    description: "Architectural tradeoffs of client-rendered interactive pages vs server components.",
    transcript: [
        { time: 0, speaker: 'Host', text: "Welcome to PathFinder Podcasts. Today we dissect React Server Components." },
        { time: 10, speaker: 'Guest', text: "Server components reduce bundle sizes because they are computed entirely on the server side." },
        { time: 25, speaker: 'Host', text: "But what if we need state interactions? Can we mix them? Client components solve that." },
      ]
  },
  {
    id: 10,
    title: "Distributed Cache Strategies Ep 5",
    duration: "15 mins",
    description: "How Redis handles partition failures and locks using Redlock algorithms.",
    transcript: [
        { time: 0, speaker: 'Host', text: "In high scale applications, databases become bottlenecks. Let's discuss Redis caching." },
        { time: 12, speaker: 'Guest', text: "Caching keys with sensible time-to-live is vital. Redlock helps coordinate consensus distributed locks." },
      ]
  },
];

export default function AudioPodcastsPage() {
  const [selectedTrack, setSelectedTrack] = useState(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    setPlaybackTime(0);
    setIsPlaying(false);
  }, [selectedTrack]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    const waveCount = 40;
    const step = width / waveCount;
    for (let i = 0; i <= waveCount; i++) {
      const x = i * step;
      const t = Date.now() / 150;
      const amplitude = isPlaying ? Math.sin(t + i * 0.4) * 25 + 5 : 2;
      const y = height / 2 + amplitude * Math.sin(x * 0.05);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [isPlaying, playbackTime]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <Radio className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Generative Audio Podcasts</h1>
          <p className="text-muted-foreground">Listen to on-the-go summaries of technical topics with interactive visual transcripts.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Podcast Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TRACKS.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 ${
                    selectedTrack.id === track.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                      : "border-border hover:border-slate-400"
                  }`}
                >
                  <div className="font-semibold text-foreground">{track.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{track.duration}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-center">
                <span>{selectedTrack.title}</span>
                <Button size="icon" variant="outline" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </CardTitle>
              <CardDescription>{selectedTrack.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-900 rounded-lg p-4 flex justify-center items-center relative overflow-hidden">
                <canvas ref={canvasRef} width={500} height={120} className="max-w-full rounded bg-slate-950 border border-slate-800" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 text-purple-400">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-[10px] font-mono">Audio Stream Active</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Music className="w-4 h-4 text-purple-500" />
                  Live Highlight Transcript
                </h3>
                <div className="border border-border/50 rounded-xl p-4 space-y-3 min-h-[160px] bg-muted/20">
                  {selectedTrack.transcript.map((line, idx) => {
                    const isActive = playbackTime >= line.time && (idx + 1 === selectedTrack.transcript.length || playbackTime < selectedTrack.transcript[idx + 1].time);
                    
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 text-xs leading-relaxed transition-all duration-300 p-2 rounded-lg ${
                          isActive ? "bg-purple-100/50 dark:bg-purple-950/30 scale-[1.01]" : ""
                        }`}
                      >
                        <span className="font-bold font-mono text-[10px] text-purple-500 shrink-0 w-12">{line.speaker}:</span>
                        <p className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>{" "}{line.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
