"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles, Building2, Target, Clock3, TrendingUp, ShieldCheck, BrainCircuit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/misc/utils";
import LinkedinImportButton from "@/components/linkedin-import-button";

const ringColors = {
  "primary": { track: "oklch(var(--primary) / 0.8)", iconBg: "bg-primary/10", iconText: "text-primary" },
  "emerald-500": { track: "oklch(0.65 0.15 160 / 0.8)", iconBg: "bg-emerald-500/10", iconText: "text-emerald-500" },
  "blue-500": { track: "oklch(0.55 0.18 250 / 0.8)", iconBg: "bg-blue-500/10", iconText: "text-blue-500" },
  "purple-500": { track: "oklch(0.55 0.2 300 / 0.8)", iconBg: "bg-purple-500/10", iconText: "text-purple-500" },
};

const barColors = {
  "emerald-500": "bg-emerald-500",
  "blue-500": "bg-blue-500",
  "purple-500": "bg-purple-500",
  "amber-500": "bg-amber-500",
};

function ScoreRing({ value, label, icon: Icon, color, size = "md" }) {
  const scheme = ringColors[color] ?? ringColors.primary;
  const radius = size === "lg" ? 28 : 22;
  const stroke = size === "lg" ? 5 : 4;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const dim = (radius + stroke) * 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={radius + stroke / 2}
            cy={radius + stroke / 2}
            r={normalizedRadius}
            fill="none"
            stroke="oklch(var(--border) / 0.3)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={radius + stroke / 2}
            cy={radius + stroke / 2}
            r={normalizedRadius}
            fill="none"
            stroke={scheme.track}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("flex items-center justify-center rounded-full", size === "lg" ? "h-9 w-9" : "h-7 w-7", scheme.iconBg)}>
            <Icon className={cn(size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5", scheme.iconText)} />
          </div>
        </div>
      </div>
      <span className={cn("font-black tabular-nums", size === "lg" ? "text-lg" : "text-sm")}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    </motion.div>
  );
}

function ScoreBar({ value, label, color }) {
  const barClass = barColors[color] ?? "bg-primary";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn("h-full rounded-full", barClass)}
        />
      </div>
    </div>
  );
}

export function WelcomeHero({ userName, currentRole, targetRole, insight, careerScore, marketScore, demandScore, growthScore, salaryScore }) {
  const { user } = useUser();
  const firstName = user?.firstName || userName;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const lastUpdated = insight?.lastUpdated
    ? formatDistanceToNow(new Date(insight.lastUpdated), { addSuffix: true })
    : null;

  const industryLabel = insight?.industry || "your industry";
  const marketLabel =
    insight?.marketOutlook === "Positive"
      ? "positive outlook"
      : insight?.marketOutlook === "Neutral"
        ? "stable conditions"
        : "cautious outlook";

  const demandColor =
    insight?.demandLevel === "High" ? "emerald-500" : insight?.demandLevel === "Medium" ? "amber-500" : "red-500";

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-3d">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.06] rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/[0.04] rounded-full blur-[100px] -z-10 -translate-x-1/4 translate-y-1/4" />

      <div className="p-6 md:p-10 lg:p-12 space-y-8">
        {/* Top row: greeting + badges */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5"
            >
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3" />
                Career Intelligence
              </span>
              {insight?.isGrounded != null && (
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    insight.isGrounded
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-amber-500/10 text-amber-500"
                  )}
                >
                  {insight.isGrounded ? "Grounded AI" : "AI Predicted"}
                </span>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]"
            >
              <span className="text-gradient-hero">{greeting}, {firstName}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed"
            >
              Your <span className="font-semibold text-foreground">{industryLabel}</span> sector has a{" "}
              <span className="font-semibold text-foreground">{marketLabel}</span>.{" "}
              {insight?.growthRate != null && (
                <>The market is projected to grow <span className="font-semibold text-foreground">{insight.growthRate}%</span>.</>
              )}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0"
          >
            <LinkedinImportButton className="rounded-full shadow-sm text-xs h-9 px-4" />
            
            {lastUpdated && (
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50">
                <Clock3 className="h-3 w-3" />
                Updated {lastUpdated}
              </span>
            )}
          </motion.div>
        </div>

        {/* Score Rings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center sm:justify-start gap-6 md:gap-10 py-4 overflow-hidden max-w-full"
        >
          <ScoreRing value={careerScore ?? 70} label="Career" icon={BrainCircuit} color="primary" size="lg" />
          <ScoreRing value={marketScore ?? 60} label="Market" icon={TrendingUp} color="emerald-500" />
          <ScoreRing value={salaryScore ?? 50} label="Salary" icon={ShieldCheck} color="blue-500" />
          <ScoreRing value={growthScore ?? 50} label="Growth" icon={TrendingUp} color="purple-500" />
        </motion.div>

        {/* Info badges */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap items-center gap-2.5"
        >
          {insight?.industry && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {insight.industry}
            </div>
          )}
          {currentRole && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              {currentRole}
            </div>
          )}
          {targetRole && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Aiming for {targetRole}
            </div>
          )}
          {insight?.demandLevel && (
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold",
              insight.demandLevel === "High"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : insight.demandLevel === "Medium"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
            )}>
              {insight.demandLevel} Demand
            </div>
          )}
        </motion.div>

        {/* Score bars for detailed view */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/30"
        >
          <ScoreBar value={marketScore ?? 50} label="Market Health" color="emerald-500" />
          <ScoreBar value={demandScore ?? 50} label="Talent Demand" color="blue-500" />
          <ScoreBar value={growthScore ?? 50} label="Industry Growth" color="purple-500" />
          <ScoreBar value={salaryScore ?? 50} label="Salary Potential" color="amber-500" />
        </motion.div>
      </div>
    </div>
  );
}
