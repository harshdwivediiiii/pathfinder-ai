"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  Route,
  FileText,
  MessageSquare,
  Briefcase,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { TiltCard } from "@/components/motion/tilt-card";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Sparkles, title: "Input Your Skills", desc: "Tell us what you know and where you want to go." },
  { icon: Route, title: "AI Analyzes", desc: "Our engine maps your profile against 10,000+ career paths." },
  { icon: FileText, title: "Personalized Roadmap", desc: "A step-by-step plan tailored to your goals." },
  { icon: MessageSquare, title: "ATS Resume", desc: "AI-built resume optimized for the algorithms." },
  { icon: Briefcase, title: "Job Matches", desc: "Real-time roles matched to your skills and trajectory." },
  { icon: CheckCircle, title: "Offer", desc: "From application to signed offer." },
];

const stats = [
  { value: "10,000+", label: "Roles Mapped" },
  { value: "92%", label: "Avg Match Score" },
  { value: "3x", label: "Faster Job Search" },
  { value: "4.8/5", label: "User Rating" },
];

const pills = [
  "Personalized Roadmaps",
  "ATS Resume AI",
  "Live Job Matching",
  "Interview Coaching",
  "Skill Gap Analysis",
  "Career Break Support",
];

function CountUp({ target, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);

  const numericMatch = target.match(/^[0-9][0-9,]*(?:\.[0-9]+)?/);
  const numericTarget = numericMatch ? parseFloat(numericMatch[0].replace(/,/g, "")) || 0 : 0;
  const decimals = numericMatch ? (numericMatch[0].split(".")[1] || "").length : 0;
  const displaySuffix = suffix || target.slice(numericMatch ? numericMatch[0].length : 0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * numericTarget);
      if (p < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, numericTarget]);

  const formatted = val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className="text-3xl md:text-4xl font-black text-foreground">
      {formatted}{displaySuffix}
    </span>
  );
}

export function CareerDetailsSection() {
  return (
    <section className="relative py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">

        <FadeUp className="max-w-4xl mx-auto text-center mb-20 space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            How It Works
          </span>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            From Skills to{" "}
            <span className="text-gradient-primary">Offer</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Six steps. One AI engine. Your complete career transformation.
          </p>
        </FadeUp>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24">
          {steps.map((step, i) => (
            <StaggerItem key={step.title}>
              <TiltCard tiltDegree={3} className="h-full">
                <div className="relative p-6 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 h-full">
                  <div className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-background">
                    {i + 1}
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-base font-bold tracking-tight text-foreground mb-1.5">{step.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeUp className="max-w-5xl mx-auto mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-6 rounded-2xl bg-card/40 backdrop-blur-md border border-border/30">
                <CountUp target={s.value} />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </FadeUp>

        <FadeUp className="max-w-3xl mx-auto mb-24">
          <div className="flex flex-wrap justify-center gap-3">
            {pills.map((pill) => (
              <span
                key={pill}
                className="px-4 py-2 rounded-full bg-primary/5 border border-primary/15 text-sm font-medium text-primary/80 backdrop-blur-sm"
              >
                {pill}
              </span>
            ))}
          </div>
        </FadeUp>

        <FadeUp className="max-w-2xl mx-auto text-center">
          <div className="p-8 md:p-12 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-xl space-y-6">
            <h3 className="text-2xl md:text-4xl font-bold text-foreground">
              Ready to Start?
            </h3>
            <p className="text-muted-foreground">
              Join thousands of professionals who transformed their careers with PathFinder AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl px-8">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl px-8">
                View Demo
              </Button>
            </div>
          </div>
        </FadeUp>

      </div>
    </section>
  );
}
