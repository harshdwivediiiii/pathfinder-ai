"use client";

import { motion, useTransform } from "framer-motion";
import { Sparkles, TrendingUp, FileText, CheckCircle } from "lucide-react";

const panels = [
  {
    id: 1,
    range: [0.0, 0.20],
    enter: [0.0, 0.04, 0.16, 0.20],
    align: "left",
    icon: Sparkles,
    badge: "AI Analysis",
    heading: "Your Skills, Decoded.",
    sub: "AI reads between the lines of your experience to surface what matters.",
    stats: null,
    accent: "blue",
  },
  {
    id: 2,
    range: [0.22, 0.46],
    enter: [0.18, 0.24, 0.42, 0.46],
    align: "right",
    icon: TrendingUp,
    badge: "Roadmap",
    heading: "Every Step, Mapped.",
    sub: "A personalized career progression built from your unique profile.",
    stats: [
      { value: "6–8mo", label: "Roadmap" },
      { value: "92%", label: "Match Score" },
    ],
    accent: "emerald",
  },
  {
    id: 3,
    range: [0.50, 0.74],
    enter: [0.46, 0.52, 0.70, 0.74],
    align: "left",
    icon: FileText,
    badge: "Resume AI",
    heading: "Resume, Rebuilt.",
    sub: "ATS-optimized, keyword-targeted, designed to get past the algorithm.",
    stats: [
      { value: "3", label: "Projects Suggested" },
      { value: "+40%", label: "ATS Score" },
    ],
    accent: "amber",
  },
  {
    id: 4,
    range: [0.78, 1.0],
    enter: [0.74, 0.80, 0.96, 1.0],
    align: "center",
    icon: CheckCircle,
    badge: "Offer",
    heading: "Your Offer Awaits.",
    sub: "From skills to signed offer. The complete career transformation.",
    stats: null,
    accent: "primary",
  },
];

const accentMap = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-500",
  primary: "bg-primary/10 border-primary/20 text-primary",
};

const spinBadgeAccents = {
  blue: "border-blue-500/20 text-blue-500",
  emerald: "border-emerald-500/20 text-emerald-500",
  amber: "border-amber-500/20 text-amber-500",
  primary: "border-primary/20 text-primary",
};

function StatBadge({ value, label }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-background/60 backdrop-blur-md border border-border/50">
      <span className="text-2xl md:text-3xl font-black text-foreground">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function SpinBadge({ accent, icon: Icon }) {
  return (
    <div className={`relative h-16 w-16 rounded-full border-2 ${spinBadgeAccents[accent]} flex items-center justify-center`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
        <circle
          cx="32" cy="32" r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 6"
          className="animate-spin-slow origin-center opacity-40"
        />
      </svg>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function TextPanel({ panel, scrollProgress }) {
  const { enter, align, icon, badge, heading, sub, stats, accent } = panel;

  const opacity = useTransform(scrollProgress, enter, [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, enter, [60, 0, 0, -60]);
  const scale = useTransform(scrollProgress, enter, [0.96, 1, 1, 0.96]);

  const alignClasses = {
    left: "items-start text-left",
    right: "items-end text-right",
    center: "items-center text-center",
  };

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className={`absolute inset-0 flex flex-col justify-center px-[6%] md:px-[10%] z-10 pointer-events-none ${alignClasses[align]}`}
    >
      <div className={`max-w-2xl ${align === "center" ? "mx-auto" : ""}`}>
        <div className="flex items-center gap-3 mb-6">
          <SpinBadge accent={accent} icon={icon} />
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${accentMap[accent]}`}>
            {badge}
          </span>
        </div>

        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.05] mb-4">
          {heading}
        </h2>

        <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed mb-8">
          {sub}
        </p>

        {stats && (
          <div className={`flex gap-4 ${align === "center" ? "justify-center" : ""}`}>
            {stats.map((s) => (
              <StatBadge key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function CareerTextOverlays({ scrollProgress }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/60 pointer-events-none" />
      {panels.map((panel) => (
        <TextPanel key={panel.id} panel={panel} scrollProgress={scrollProgress} />
      ))}
    </div>
  );
}
