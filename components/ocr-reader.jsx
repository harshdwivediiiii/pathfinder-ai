"use client";

import React, { useState, useRef, useEffect } from "react";
import { createWorker } from "tesseract.js";
import { Camera, Volume2, Loader2, RefreshCcw, Languages, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/misc/utils";

export default function OCRReader() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const workerLangRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState("eng"); // 'eng' or 'hin'

  // Initialize camera
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageUrl = canvas.toDataURL("image/png");
      setCapturedImage(imageUrl);
      processImage(imageUrl);
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    setExtractedText("");
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    // Restart camera if it was stopped
    startCamera();
  };

  const processImage = async (imageUrl) => {
    setIsProcessing(true);
    setExtractedText("");
    let worker = null;
    try {
      // Stop camera stream to freeze the frame completely if needed,
      // but we already captured to canvas. We can stop camera to save battery,
      // but let's keep it simple and just show the captured image.
      stopCamera();

      worker = await createWorker(language);
      
      const ret = await worker.recognize(imageUrl);
      
      const text = ret.data.text.trim();
      setExtractedText(text);
      
      if (!text) {
        toast.error("No text detected. Try again with a clearer image.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Failed to extract text. Please try again.");
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsProcessing(false);
    }
  };

  const speakText = () => {
    if (!extractedText) return;
    
    if (window.speechSynthesis) {
      // If already speaking, stop it
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(extractedText);
      utterance.lang = language === "hin" ? "hi-IN" : "en-US";
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        setIsSpeaking(false);
        toast.error("Error playing audio.");
      };

      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech is not supported in this browser.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="border-border/50 shadow-xl overflow-hidden bg-background/50 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Volume2 className="h-6 w-6 text-primary" />
                Read Text
              </CardTitle>
              <CardDescription>
                Point camera at text and hear it spoken aloud.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Select value={language} onValueChange={(val) => setLanguage(val)} disabled={isProcessing}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eng">English</SelectItem>
                  <SelectItem value="hin">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] bg-black w-full overflow-hidden flex flex-col items-center justify-center">
            
            {/* Camera View */}
            {!capturedImage && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Captured Image View */}
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured text"
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  isProcessing && "opacity-50 blur-sm scale-105"
                )}
              />
            )}
            
            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm z-10">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium animate-pulse text-white">Reading text...</p>
              </div>
            )}
            
            {/* Hidden Canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-center gap-4 z-20">
              {!capturedImage ? (
                <Button 
                  size="lg" 
                  aria-label="Capture image"
                  onClick={captureImage}
                  className="rounded-full w-16 h-16 shadow-2xl bg-white hover:bg-white/90 border-4 border-primary/20 flex items-center justify-center p-0"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center">
                    <Camera className="h-6 w-6 text-black" />
                  </div>
                </Button>
              ) : (
                <div className="flex gap-4 w-full px-4">
                  <Button 
                    variant="outline"
                    size="lg" 
                    onClick={retakeImage}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl bg-background/20 backdrop-blur border-white/20 hover:bg-background/40 text-white"
                  >
                    <RefreshCcw className="h-5 w-5 mr-2" />
                    Retake
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={speakText}
                    disabled={isProcessing || !extractedText}
                    className={cn(
                      "flex-1 rounded-xl shadow-lg transition-all",
                      isSpeaking ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                  >
                    {isSpeaking ? (
                      <>
                        <StopCircle className="h-5 w-5 mr-2 animate-pulse" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-5 w-5 mr-2" />
                        Play Audio
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Text Display */}
      {extractedText && (
        <Card className="border-primary/20 bg-primary/5 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="py-3 px-4 border-b border-primary/10 bg-primary/5">
            <CardTitle className="text-sm font-medium text-primary flex items-center justify-between">
              Extracted Text
              <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">{language === 'eng' ? 'English' : 'Hindi'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
            <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">
              {extractedText}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
