"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Volume2, UserX, UserCheck, Flame, PauseCircle, PlayCircle, Speech } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const PERSONAS = [
  {
    id: "friendly",
    name: "Friendly Peer",
    description: "Relaxed, supportive, standard pacing. Good for a warm-up.",
    icon: <UserCheck className="h-5 w-5 text-emerald-500" />,
    color: "emerald",
    settings: { pitch: 1.2, rate: 1.0, volume: 1.0 }
  },
  {
    id: "skeptical",
    name: "Skeptical Senior",
    description: "Deep voice, slower pacing. Questions your architectural choices.",
    icon: <UserX className="h-5 w-5 text-indigo-500" />,
    color: "indigo",
    settings: { pitch: 0.7, rate: 0.85, volume: 1.0 }
  },
  {
    id: "stressed",
    name: "Stressed Manager",
    description: "Fast-paced, high pitch. Wants immediate results.",
    icon: <Flame className="h-5 w-5 text-rose-500" />,
    color: "rose",
    settings: { pitch: 1.5, rate: 1.4, volume: 1.0 }
  }
];

export default function InterviewPersonasPage() {
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [text, setText] = useState("Hello! I've reviewed your resume and I'm very interested in your background. Can you walk me through your most recent project?");
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Initialize Speech Synthesis and Voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        // Try to find a good English voice
        const defaultVoice = availableVoices.find(v => v.lang.startsWith("en-US")) || availableVoices[0];
        setSelectedVoice(defaultVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (!text) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Apply persona settings
    utterance.pitch = selectedPersona.settings.pitch;
    utterance.rate = selectedPersona.settings.rate;
    utterance.volume = selectedPersona.settings.volume;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const generateRandomQuestion = () => {
    const questions = {
      friendly: "Hey there! I saw you used React on your last project. What was the most fun part about building that?",
      skeptical: "I noticed you chose MongoDB for this application. A NoSQL database seems like a risky choice here. Justify your reasoning.",
      stressed: "Listen, we're on a tight deadline. I need to know if you can ship this feature by Friday. Walk me through exactly how you'd implement the caching layer, right now."
    };
    setText(questions[selectedPersona.id]);
  };

  return (
    <div className="container max-w-5xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
          <Speech className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Voice AI Personas</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Dynamic Interviewer <span className="text-gradient-primary">Simulation.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practice mock interviews with emotionally simulated voices. Experience the pacing of a stressed manager or the deep scrutiny of a skeptical senior engineer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Personas Selection */}
        <div className="col-span-1 lg:col-span-4 space-y-4">
          <h3 className="text-lg font-bold mb-4">Select Persona</h3>
          {PERSONAS.map(persona => (
            <div 
              key={persona.id}
              onClick={() => setSelectedPersona(persona)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                selectedPersona.id === persona.id 
                  ? `bg-${persona.color}-500/10 border-${persona.color}-500/50 ring-1 ring-${persona.color}-500/50 shadow-sm shadow-${persona.color}-500/20` 
                  : "bg-background/50 border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl bg-${persona.color}-500/20`}>
                  {persona.icon}
                </div>
                <h4 className="font-bold">{persona.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {persona.description}
              </p>
            </div>
          ))}
        </div>

        {/* Studio Panel */}
        <Card className="col-span-1 lg:col-span-8 glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" /> Speech Synthesis Studio
            </CardTitle>
            <CardDescription>Enter dialogue or generate a persona-specific prompt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center bg-background/50 p-3 rounded-xl border border-border">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Pitch Mod</p>
                  <p className="text-sm font-mono font-bold text-foreground">{selectedPersona.settings.pitch}x</p>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Rate Mod</p>
                  <p className="text-sm font-mono font-bold text-foreground">{selectedPersona.settings.rate}x</p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={generateRandomQuestion} className="rounded-xl h-10">
                Generate Question
              </Button>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px] resize-none rounded-xl text-base p-4"
              placeholder="Enter text for the interviewer..."
            />

            <div className="flex flex-col sm:flex-row gap-4">
              {isPlaying ? (
                <Button 
                  onClick={handleStop}
                  className="flex-1 h-14 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg"
                >
                  <PauseCircle className="mr-2 h-6 w-6 animate-pulse" /> Stop Audio
                </Button>
              ) : (
                <Button 
                  onClick={handlePlay}
                  className="flex-1 h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg"
                >
                  <PlayCircle className="mr-2 h-6 w-6" /> Play Voice Persona
                </Button>
              )}
            </div>
            
            {voices.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Note: Web Speech API voices are still loading or not supported in this browser.
              </p>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
