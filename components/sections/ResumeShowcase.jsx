"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, CheckCircle } from "lucide-react";
import { FadeUp } from "@/components/motion";
import { ScrollSpinningResume } from "@/components/ScrollSpinningResume";
import { TiltCard } from "@/components/motion/tilt-card";

export function ResumeShowcase() {
  const ref = useRef(null);

  return (
    <section ref={ref} id="resume-showcase" className="relative py-20 sm:py-24 md:py-32 lg:py-40 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <FadeUp className="max-w-3xl mx-auto text-center mb-20 space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
            <FileText className="h-3 w-3" />
            Resume Builder
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            ATS-Optimized{" "}
            <span className="text-gradient-primary">Resumes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Premium templates designed to pass automated screenings and impress hiring managers.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-5xl mx-auto">
          <ScrollSpinningResume />

          <div className="space-y-6">
            <FadeUp delay={0.2}>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                Smart formatting that hiring systems love
              </h3>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Our AI analyzes thousands of job descriptions to optimize your resume for each
                application. Every section, keyword, and bullet point is strategically placed.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "ATS Score", value: "94%", color: "text-chart-2", desc: "Passes automated screening" },
                { label: "Keyword Match", value: "96%", color: "text-chart-1", desc: "Aligned with job descriptions" },
                { label: "Format Score", value: "100%", color: "text-chart-3", desc: "Professional layout" },
                { label: "Readability", value: "A+", color: "text-chart-5", desc: "Clear & scannable" },
              ].map((stat) => (
                <FadeUp key={stat.label} delay={0.3}>
                  <TiltCard className="glass rounded-xl p-4 border border-border/30 text-center hover:border-primary/30 transition-all duration-300" tiltDegree={5}>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground/80 mt-1">{stat.desc}</p>
                  </TiltCard>
                </FadeUp>
              ))}
            </div>

            <FadeUp delay={0.4}>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-chart-2" />
                <span>Free to start — upgrade for unlimited access</span>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
