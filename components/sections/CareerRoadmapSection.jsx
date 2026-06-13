"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";

const milestones = [
  { label: "Student", desc: "Foundation & learning", year: "Year 1", x: 80, y: 80 },
  { label: "Intern", desc: "Real-world experience", year: "Year 2", x: 180, y: 130 },
  { label: "Junior Dev", desc: "Building products", year: "Year 3-4", x: 300, y: 100 },
  { label: "Software Engineer", desc: "Ship at scale", year: "Year 5+", x: 420, y: 170 },
  { label: "Senior Engineer", desc: "Lead & architect", year: "Year 8+", x: 320, y: 280 },
  { label: "Staff Engineer", desc: "Org-wide impact", year: "Year 10+", x: 140, y: 250 },
];

const pathD = `M 80 80
Q 130 40 180 130
Q 240 200 300 100
Q 360 40 420 170
Q 400 260 320 280
Q 220 330 140 250`;

export function CareerRoadmapSection() {
  const [hovered, setHovered] = useState(null);

  return (
    <section id="career-roadmap" className="relative py-8 md:py-12 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <FadeUp className="max-w-3xl mx-auto text-center mb-20 space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
            Career Roadmap
          </span>
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-foreground">
            Your{" "}
            <span className="text-gradient-primary">Career Progression</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visualize your path from student to industry leader with AI-tailored milestones.
          </p>
        </FadeUp>

        <div className="max-w-5xl mx-auto">
          <svg viewBox="0 0 500 365" className="w-full h-auto">
            <defs>
              <linearGradient id="roadmapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(var(--primary) / 0.6)" />
                <stop offset="100%" stopColor="oklch(var(--primary) / 0.1)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <path
              d={pathD}
              fill="none"
              stroke="oklch(var(--border) / 0.35)"
              strokeWidth="3"
              strokeDasharray="8 8"
            />

            <motion.path
              d={pathD}
              fill="none"
              stroke="url(#roadmapGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2 }}
            />

            {milestones.map((m, i) => (
              <g
                key={m.label}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <motion.circle
                  cx={m.x}
                  cy={m.y}
                  r="18"
                  fill="rgba(255,255,255,0.08)"
                  stroke="oklch(var(--primary) / 0.8)"
                  strokeWidth="1.5"
                  animate={{ scale: hovered === i ? 1.2 : 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ filter: hovered === i ? "url(#glow)" : "none" }}
                />
                <motion.circle
                  cx={m.x}
                  cy={m.y}
                  r="6"
                  fill="oklch(var(--primary) / 1)"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
                <foreignObject
                  x={m.x - 55}
                  y={m.y + 28}
                  width="110"
                  height="60"
                  style={{ overflow: "visible" }}
                >
                  <div className={`flex flex-col items-center justify-center p-2 rounded-xl bg-card/80 backdrop-blur-md shadow-lg border transition-all duration-300 pointer-events-none ${hovered === i ? "border-primary/50" : "border-border/30"}`}>
                    <span className="text-xs font-bold text-foreground leading-none text-center mb-1">
                      {m.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight text-center">
                      {m.desc}
                    </span>
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>
        </div>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-16 max-w-4xl mx-auto">
          {milestones.map((m) => (
            <StaggerItem key={m.label}>
              <div className="glass rounded-xl p-4 text-center border border-border/30 space-y-1 hover:border-primary/30 transition-all duration-300">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{m.year}</span>
                <p className="text-xs font-bold text-foreground">{m.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
