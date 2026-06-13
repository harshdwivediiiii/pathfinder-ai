"use client";

import { useState, useRef, useEffect } from "react";
import { evaluateVideoAnswer } from "@/actions/interview";
import { Video, Square, RotateCcw, Sparkles, AlertCircle, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const QUESTION = "Describe a time when you disagreed with a team member. How did you resolve it?";

export default function VideoCoachPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Camera and Speech Recognition
  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setPermissionsGranted(true);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError("Camera and microphone access denied. Please allow permissions in your browser.");
      }
    }

    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
        };
      } else {
        setError("Speech Recognition is not supported in this browser. Try Google Chrome.");
      }
    }

    setupMedia();

    return () => {
      // Cleanup stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!permissionsGranted || error) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      handleEvaluate();
    } else {
      setTranscript("");
      setEvaluation(null);
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleEvaluate = async () => {
    setTimeout(async () => {
      if (!transcript.trim()) {
        toast.error("No speech detected. Please speak louder.");
        return;
      }
      setEvaluating(true);
      
      // Simulated Body Language Metrics for V3 MVP
      const simulatedMetrics = {
        faceDetectedPercentage: 92,
        eyeContactConsistency: "Good",
        posture: "Upright"
      };

      const res = await evaluateVideoAnswer(QUESTION, transcript, simulatedMetrics);
      if (res.success) {
        setEvaluation(res.data);
      } else {
        toast.error(res.error);
      }
      setEvaluating(false);
    }, 1000); // Give transcript time to finalize
  };

  const handleRetry = () => {
    setTranscript("");
    setEvaluation(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-10 flex flex-col min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-4">
            <Video className="h-3 w-3" />
            Video Coach
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Master Your <span className="text-gradient-primary">Presence</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl mx-auto">
            Practice with your webcam. We'll transcribe your answer and evaluate your verbal delivery alongside your visual body language.
          </p>
        </motion.div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center max-w-2xl mx-auto">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-border aspect-video">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${isRecording ? '' : 'opacity-50 grayscale'}`}
                />
                
                {/* Recording UI Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                  <div className="relative group">
                    {isRecording && (
                      <div className="absolute -inset-4 bg-red-500/50 rounded-full animate-ping blur-sm" />
                    )}
                    <button
                      onClick={toggleRecording}
                      className={`relative z-10 h-20 w-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                        isRecording 
                          ? 'bg-red-500 text-white hover:bg-red-600 scale-105' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isRecording ? <Square className="h-8 w-8 fill-current" /> : <Video className="h-8 w-8" />}
                    </button>
                  </div>
                  <span className={`font-bold px-4 py-1.5 rounded-full text-sm backdrop-blur-md ${isRecording ? 'bg-red-500/20 text-red-500' : 'bg-black/50 text-white'}`}>
                    {isRecording ? "● RECORDING" : "CLICK TO START"}
                  </span>
                </div>
              </div>

              {transcript && (
                <div className="p-6 bg-muted/50 rounded-2xl border border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Live Transcript</h4>
                  <p className="text-sm italic text-foreground leading-relaxed">"{transcript}"</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border p-6 rounded-3xl shadow-lg"
              >
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Current Question
                </h3>
                <p className="text-xl font-semibold leading-relaxed text-foreground">
                  "{QUESTION}"
                </p>
              </motion.div>

              {evaluating && (
                <div className="flex-1 bg-card border border-border rounded-3xl shadow-lg flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  <p className="font-bold text-muted-foreground animate-pulse text-sm">Analyzing verbal and visual cues...</p>
                </div>
              )}

              {evaluation && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col overflow-y-auto custom-scrollbar"
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <h2 className="text-xl font-bold">Evaluation</h2>
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-black text-lg">
                      {evaluation.score}/100
                    </div>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
                        <span className="block text-xs font-bold text-muted-foreground uppercase mb-1">Confidence</span>
                        <span className="text-lg font-black text-primary">{evaluation.confidence}</span>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
                        <span className="block text-xs font-bold text-muted-foreground uppercase mb-1">Filler Words</span>
                        <span className={`text-lg font-black ${evaluation.fillerWordsCount > 5 ? 'text-red-500' : 'text-green-500'}`}>
                          {evaluation.fillerWordsCount}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" /> Body Language
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                        {evaluation.bodyLanguageFeedback}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> Verbal Delivery
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed p-3 bg-primary/5 rounded-xl border border-primary/10">
                        {evaluation.verbalFeedback}
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleRetry} className="w-full mt-6 h-12 rounded-xl font-bold" variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" /> Next Question
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
