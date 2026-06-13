"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";

const milestones = [
  { label: "Student", desc: "Foundation & learning", year: "Year 1", x: 50, y: 30 },
  { label: "Intern", desc: "Real-world experience", year: "Year 2", x: 85, y: 18 },
  { label: "Junior Dev", desc: "Building products", year: "Year 3-4", x: 92, y: 40 },
  { label: "Software Engineer", desc: "Ship at scale", year: "Year 5+", x: 75, y: 68 },
  { label: "Senior Engineer", desc: "Lead & architect", year: "Year 8+", x: 40, y: 80 },
  { label: "Staff Engineer", desc: "Org-wide impact", year: "Year 10+", x: 15, y: 60 },
];

export function CareerRoadmapSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const [hovered, setHovered] = useState(null);

  const drawProgress = useTransform(scrollYProgress, [0, 0.6], [0, 1]);

  const pathD = milestones
    .map((m, i) => `${i === 0 ? "M" : "L"}${m.x * 2.8 + 100} ${m.y * 2.8 + 60}`)
    .join(" ");

  return (
    <section ref={ref} id="career-roadmap" className="relative py-32 md:py-48 overflow-hidden">
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

        <div className="relative mx-auto max-w-4xl">
          <svg viewBox="0 0 500 360" className="w-full h-auto">
            <defs>
              <linearGradient id="roadmapGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(var(--primary) / 0.6)" />
                <stop offset="100%" stopColor="oklch(var(--primary) / 0.1)" />
              </linearGradient>
              <filter id="glow2">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <path
              d={pathD}
              fill="none"
              stroke="oklch(var(--border) / 0.3)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <motion.path
              d={pathD}
              fill="none"
              stroke="url(#roadmapGrad2)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pathLength: drawProgress }}
            />

            {milestones.map((m, i) => (
              <g
                key={m.label}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <motion.circle
                  cx={m.x * 2.8 + 100}
                  cy={m.y * 2.8 + 60}
                  r={hovered === i ? 22 : 14}
                  fill="oklch(var(--card) / 1)"
                  stroke={
                    hovered === i
                      ? "oklch(var(--primary) / 1)"
                      : "oklch(var(--border) / 0.8)"
                  }
                  strokeWidth="2"
                  transition={{ duration: 0.3 }}
                  style={{ filter: hovered === i ? "url(#glow2)" : "none" }}
                />
                <motion.circle
                  cx={m.x * 2.8 + 100}
                  cy={m.y * 2.8 + 60}
                  r={6}
                  fill="oklch(var(--primary) / 1)"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
                <text
                  x={m.x * 2.8 + 100}
                  y={m.y * 2.8 + 85}
                  textAnchor="middle"
                  fill="oklch(var(--foreground) / 1)"
                  fontSize="12"
                  fontWeight="700"
                >
                  {m.label}
                </text>
                <text
                  x={m.x * 2.8 + 100}
                  y={m.y * 2.8 + 100}
                  textAnchor="middle"
                  fill="oklch(var(--muted-foreground) / 0.8)"
                  fontSize="9"
                >
                  {m.desc}
                </text>
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
