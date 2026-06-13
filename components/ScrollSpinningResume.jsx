"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Sparkles, FileText } from "lucide-react";

const skills = ["React", "TypeScript", "Python", "System Design", "AWS", "Leadership", "GraphQL", "Docker"];
const experiences = [
  { title: "Senior Frontend Engineer", company: "Tech Corp", period: "2022 - Present" },
  { title: "Full Stack Developer", company: "StartupX", period: "2020 - 2022" },
  { title: "Junior Developer", company: "WebCo", period: "2018 - 2020" },
];
const education = [
  { degree: "B.S. Computer Science", school: "Stanford University", year: "2018" },
];

export function ScrollSpinningResume() {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 25,
    mass: 0.5,
  });

  const rotateY = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], [0, 10, 20, 30, 35]);
  const rotateX = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], [0, -3, -5, -8, -10]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.95, 0.85]);
  const opacity = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.85, 0.6]);
  const atsScore = useTransform(smoothProgress, [0.5, 1], [0, 94]);

  return (
    <div ref={ref} className="relative w-full max-w-md mx-auto" style={{ perspective: "1200px" }}>
      <motion.div
        style={{
          rotateY,
          rotateX,
          scale,
          opacity,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full aspect-[3/4] rounded-2xl border border-border/50 bg-card overflow-hidden shadow-elevated"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-chart-3 to-chart-4" />

        <div className="p-6 md:p-7 space-y-5" style={{ transform: "translateZ(20px)" }}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Alex Morgan</h3>
              <p className="text-[11px] text-muted-foreground">alex.morgan@email.com</p>
              <p className="text-[11px] text-muted-foreground">San Francisco, CA</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Experience</h4>
            {experiences.map((exp) => (
              <div key={exp.title} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">{exp.title}</p>
                  <span className="text-[9px] text-muted-foreground">{exp.period}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{exp.company}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Education</h4>
            {education.map((edu) => (
              <div key={edu.degree} className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">{edu.degree}</p>
                <p className="text-[10px] text-muted-foreground">{edu.school} — {edu.year}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border/30 pt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">ATS Compatibility</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {Math.round(atsScore.get())}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-chart-3 to-chart-4"
                style={{ width: useTransform(atsScore, (v) => `${v}%`) }}
              />
            </div>
          </div>
        </div>

        <motion.div
          className="absolute -top-2 -right-2 h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg"
          style={{ transform: "translateZ(40px)" }}
        >
          <motion.span style={{ opacity: useTransform(atsScore, [0, 50, 94], [0, 0, 1]) }}>
            {Math.round(atsScore.get())}%
          </motion.span>
        </motion.div>

        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, oklch(from var(--foreground) 0 0 0 / 0.04) 0%, transparent 50%)",
            transform: "translateZ(10px)",
          }}
        />
      </motion.div>
    </div>
  );
}
