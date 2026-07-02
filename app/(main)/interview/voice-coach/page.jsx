"use client";

import { useState, useRef, useEffect } from "react";
import { evaluateVoiceAnswer, getCoachQuestions } from "@/actions/interview";
import useFetch from "@/hooks/use-fetch";
import { Mic, Square, Play, RotateCcw, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useTranslation } from "@/hooks/use-translation";

export default function VoiceCoachPage() {
  const { t, language } = useTranslation();
  const { data: questionPool, loading: loadingQuestion, error: questionError, fn: loadQuestions } = useFetch(getCoachQuestions);
  const [question, setQuestion] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const { speak, cancel, supported: ttsSupported } = useTextToSpeech();
  
  const recognitionRef = useRef(null);

  // Reload when language changes so the prompt stays in sync with speech recognition locale
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadQuestions(language); }, [language]);

  useEffect(() => {
    if (questionPool?.length) {
      setQuestion(questionPool[Math.floor(Math.random() * questionPool.length)]);
    }
  }, [questionPool]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
        toast.error(t("browserNoSpeechSupport"));
      } else {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-US";

        recognitionRef.current.onresult = (event) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };
      }
    }
  }, [language, t]);

  const toggleRecording = () => {
    if (!speechSupported || loadingQuestion || !question) return;

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
      if (loadingQuestion || !question) return;
      if (!transcript.trim()) {
        toast.error(t("noSpeechDetected"));
        return;
      }
      setEvaluating(true);
      const res = await evaluateVoiceAnswer(question, transcript);
      if (res.success) {
        setEvaluation(res.data);
        
        // Use Speech Synthesis to read the feedback
        if (ttsSupported) {
          speak(res.data.feedback);
        }
      } else {
        toast.error(res.error);
      }
      setEvaluating(false);
    }, 500);
  };

  const handleRetry = () => {
    setTranscript("");
    setEvaluation(null);
    cancel();
    if (questionPool?.length) {
      const pool = questionPool.filter((q) => q !== question);
      setQuestion(pool[Math.floor(Math.random() * pool.length)] || questionPool[0]);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-10 flex flex-col min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-4">
            <Mic className="h-3 w-3" />
            {t("voiceCoach")}
          </div>
          <h1 
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4"
            dangerouslySetInnerHTML={{ __html: t("speakWithConfidence") }}
          />
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl mx-auto">
            {t("practiceSkills")}
          </p>
        </motion.div>

        {!speechSupported ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-bold">{t("speechRecognitionNotSupported")}</p>
            <p className="text-sm mt-1">{t("useCompatibleBrowser")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border p-8 rounded-3xl shadow-lg text-center"
            >
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">{t("prompt")}</h3>
              {loadingQuestion ? (
                <div className="space-y-2 animate-pulse mx-auto max-w-lg">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-4/5 mx-auto" />
                </div>
              ) : questionError ? (
                <p className="text-sm text-destructive">Failed to load question. Please refresh the page.</p>
              ) : (
                <p className="text-xl md:text-2xl font-semibold leading-relaxed text-foreground">
                  "{question}"
                </p>
              )}
            </motion.div>

            {!evaluation && !evaluating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10"
              >
                <div className="relative group">
                  {isRecording && (
                    <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping blur-sm" />
                  )}
                  <button
                    onClick={toggleRecording}
                    disabled={loadingQuestion || !question}
                    className={`relative z-10 h-32 w-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500 text-white hover:bg-red-600 scale-110'
                        : loadingQuestion || !question
                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                    }`}
                  >
                    {isRecording ? <Square className="h-10 w-10 fill-current" /> : <Mic className="h-12 w-12" />}
                  </button>
                </div>
                <p className="mt-8 font-bold text-lg">
                  {isRecording ? t("recordingClickToStop") : loadingQuestion ? "Loading question..." : t("clickMicToStart")}
                </p>

                {transcript && (
                  <div className="mt-8 p-6 bg-muted/30 rounded-2xl w-full max-w-2xl border border-border">
                    <p className="text-muted-foreground text-sm italic">"{transcript}"</p>
                  </div>
                )}
              </motion.div>
            )}

            {evaluating && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="font-bold text-muted-foreground animate-pulse">{t("analyzingResponse")}</p>
              </div>
            )}

            {evaluation && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border p-8 rounded-3xl shadow-xl space-y-8"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/50 pb-6">
                  <h2 className="text-3xl font-bold">{t("performanceAnalysis")}</h2>
                  <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-black text-2xl flex items-center gap-2">
                    {t("score")}: {evaluation.score}/100
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted/30 p-6 rounded-2xl border border-border flex flex-col justify-center items-center text-center">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("fillerWordsDetected")}</span>
                    <span className={`text-4xl font-black ${evaluation.fillerWordsCount > 5 ? 'text-red-500' : 'text-green-500'}`}>
                      {evaluation.fillerWordsCount}
                    </span>
                    <span className="text-xs text-muted-foreground mt-2">{t("fillerWordsExamples")}</span>
                  </div>

                  <div className="bg-muted/30 p-6 rounded-2xl border border-border flex flex-col justify-center items-center text-center">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("confidenceLevel")}</span>
                    <span className="text-4xl font-black text-primary">
                      {evaluation.confidence}
                    </span>
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> {t("aiFeedback")}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {evaluation.feedback}
                  </p>
                </div>

                <div className="pt-4 flex justify-center">
                  <Button onClick={handleRetry} className="h-12 px-8 rounded-xl font-bold" variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" /> {t("tryAgain")}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
