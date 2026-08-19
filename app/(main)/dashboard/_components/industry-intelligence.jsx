"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, BarChart3, Lightbulb, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/misc/utils";

const metrics = [
  {
    key: "marketOutlook",
    label: "Market Outlook",
    icon: BarChart3,
    color: "from-emerald-500/20 to-emerald-600/10",
    iconBg: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    badgeBg: "bg-emerald-500/10 text-emerald-500",
    getValue: (i) => i?.marketOutlook || "Neutral",
    getBadge: (v) => {
      if (v === "Positive") return { label: "Bullish", icon: ArrowUpRight };
      if (v === "Neutral") return { label: "Stable", icon: null };
      return { label: "Cautious", icon: ArrowDownRight };
    },
  },
  {
    key: "growthRate",
    label: "Industry Growth",
    icon: TrendingUp,
    color: "from-blue-500/20 to-blue-600/10",
    iconBg: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    badgeBg: "bg-blue-500/10 text-blue-500",
    getValue: (i) => (i?.growthRate != null ? `${i.growthRate}%` : "—"),
    getBadge: (v) => {
      const n = parseFloat(v);
      if (n > 10) return { label: "High Growth", icon: ArrowUpRight };
      if (n > 3) return { label: "Moderate", icon: null };
      return { label: "Slow", icon: ArrowDownRight };
    },
  },
  {
    key: "demandLevel",
    label: "Talent Demand",
    icon: Users,
    color: "from-purple-500/20 to-purple-600/10",
    iconBg: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    badgeBg: "bg-purple-500/10 text-purple-500",
    getValue: (i) => i?.demandLevel || "Medium",
    getBadge: (v) => {
      if (v === "High") return { label: "Hot Market", icon: ArrowUpRight };
      if (v === "Medium") return { label: "Balanced", icon: null };
      return { label: "Niche", icon: ArrowDownRight };
    },
  },
  {
    key: "topSkills",
    label: "In-Demand Skills",
    icon: Lightbulb,
    color: "from-amber-500/20 to-amber-600/10",
    iconBg: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    badgeBg: "bg-amber-500/10 text-amber-500",
    getValue: (i) => i?.topSkills?.length || 0,
    getBadge: (v) => {
      const n = typeof v === "number" ? v : 0;
      return { label: `${n} skills`, icon: null };
    },
  },
];

function IntelligenceCard({ metric, insight, index }) {
  const Icon = metric.icon;
  const value = metric.getValue(insight);
  const badge = metric.getBadge(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", metric.color)} />
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-foreground/[0.02] rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

      <div className="relative z-10 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg", metric.iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-transparent",
            metric.badgeBg
          )}>
            {badge.icon && <badge.icon className="h-3 w-3" />}
            {badge.label}
          </span>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
            {metric.label}
          </p>
          {metric.key === "topSkills" ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {insight?.topSkills?.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border/50 text-[11px] font-semibold text-foreground/80 transition-colors group-hover:bg-background/60"
                >
                  {skill}
                </span>
              ))}
              {(insight?.topSkills?.length || 0) > 4 && (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground">
                  +{insight.topSkills.length - 4}
                </span>
              )}
            </div>
          ) : (
            <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{value}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function IndustryIntelligence({ insight }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-purple-500" />
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Industry Intelligence</h2>
          <p className="text-sm text-muted-foreground">Key metrics for your sector</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {metrics.map((metric, i) => (
          <IntelligenceCard key={metric.key} metric={metric} insight={insight} index={i} />
        ))}
      </div>
    </div>
  );
}
