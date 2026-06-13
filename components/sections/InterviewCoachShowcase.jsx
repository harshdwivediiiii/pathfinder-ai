"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Sparkles, CheckCircle } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { TiltCard } from "@/components/motion/tilt-card";

const questions = [
  "Tell me about a challenging project you led.",
  "How do you handle conflicting priorities?",
  "Describe your ideal team culture.",
];

export function InterviewCoachShowcase() {
  const [currentQ, setCurrentQ] = useState(0);
  const [showTyping, setShowTyping] = useState(true);
  const [feedbackScore, setFeedbackScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowTyping(true);
      setCurrentQ((p) => {
        if (p >= questions.length - 1) {
          setFeedbackScore(82);
          return p;
        }
        return p + 1;
      });
      setTimeout(() => setShowTyping(false), 1500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { label: "Clarity", score: 88, color: "bg-chart-2" },
    { label: "Structure", score: 76, color: "bg-chart-1" },
    { label: "Impact", score: 82, color: "bg-chart-3" },
    { label: "Confidence", score: 79, color: "bg-chart-5" },
  ];

  return (
    <section id="interview-coach" className="relative py-8 md:py-12 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <FadeUp className="max-w-3xl mx-auto text-center mb-20 space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
            <Mic className="h-3 w-3" />
            Interview Coach
          </span>
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-foreground">
            Master Every{" "}
            <span className="text-gradient-primary">Interview</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice with our AI interviewer. Get real-time feedback and improve with every session.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto items-start">
          <div className="glass rounded-2xl border border-border/50 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-chart-2 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Live Session
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                ))}
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Mic className="h-3 w-3" />
              AI Interviewer
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 rounded-xl bg-primary/10 border border-primary/20"
              >
                <p className="text-sm text-foreground">{questions[currentQ]}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
              <div className="flex gap-0.5 items-end h-8">
                {[1, 2, 3, 4, 3, 5, 2, 4, 3, 2].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-primary/60 rounded-full"
                    animate={{ height: `${h * 8}px` }}
                    transition={{
                      duration: 0.3,
                      delay: i * 0.05,
                      repeat: Infinity,
                      repeatDelay: 0.3,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground animate-pulse">You are speaking...</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="flex-1 h-10 rounded-lg bg-background border border-border/50 px-4 flex items-center">
                <span className="text-xs text-muted-foreground">Type your response...</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Send className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <FadeUp delay={0.2}>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                Real-time feedback that drives improvement
              </h3>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Our AI analyzes your responses for clarity, structure, and impact. Get actionable
                suggestions to level up your interview game.
              </p>
            </FadeUp>

            <StaggerContainer className="space-y-3">
              {metrics.map((metric) => (
                <StaggerItem key={metric.label}>
                  <TiltCard className="glass rounded-xl p-4 border border-border/30 space-y-2" tiltDegree={3}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{metric.label}</span>
                      <span className="font-bold text-primary">{metric.score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${metric.color}`}
                        initial={{ width: "0%" }}
                        whileInView={{ width: `${metric.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeUp delay={0.4}>
              <motion.div
                whileHover={{ y: -2, scale: 1.01 }}
                className="glass rounded-2xl p-6 border border-primary/30 bg-primary/[0.03] text-center shadow-lg"
              >
                <p className="text-3xl font-black text-primary">{feedbackScore}/100</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
                  Overall Interview Score
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-chart-2">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Above average — keep practicing!</span>
                </div>
              </motion.div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
