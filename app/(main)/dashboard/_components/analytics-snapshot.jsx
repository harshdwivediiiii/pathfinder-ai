"use client";

import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Zap, Activity, Sparkles } from "lucide-react";
import { cn } from "@/lib/misc/utils";

const snapshotCards = [
  {
    key: "topRole",
    label: "Best Paying Role",
    icon: DollarSign,
    getValue: (props) => props.topRole?.role || "—",
    getSub: (props) =>
      props.topRole ? `$${props.topRole.median.toLocaleString()}/yr` : null,
    color: "emerald",
    trend: "up",
  },
  {
    key: "medianSalary",
    label: "Median Salary",
    icon: TrendingUp,
    getValue: (props) =>
      props.medianSalary ? `$${props.medianSalary.toLocaleString()}` : "—",
    getSub: (props) =>
      props.insight?.salaryRanges?.length
        ? `Across ${props.insight.salaryRanges.length} roles`
        : null,
    color: "blue",
    trend: null,
  },
  {
    key: "topSkill",
    label: "Top Skill",
    icon: Zap,
    getValue: (props) => props.insight?.topSkills?.[0] || "—",
    getSub: (props) =>
      props.insight?.topSkills?.length > 1
        ? `+${props.insight.topSkills.length - 1} more in demand`
        : "Top required skill",
    color: "purple",
    trend: "up",
  },
  {
    key: "demandTrend",
    label: "Demand Trend",
    icon: Activity,
    getValue: (props) => props.demandTrend || "Stable",
    getSub: (props) =>
      props.insight?.demandLevel === "High"
        ? "Active hiring market"
        : props.insight?.demandLevel === "Medium"
          ? "Selective hiring"
          : "Specialized roles",
    color: (props) => props.demandTrend === "Growing" ? "emerald" : props.demandTrend === "Stable" ? "amber" : "red",
    trend: (props) => {
      if (props.demandTrend === "Growing") return "up";
      if (props.demandTrend === "Stable") return null;
      return "down";
    },
  },
];

const colorMap = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", ring: "from-emerald-500/20 to-emerald-600/5" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", ring: "from-blue-500/20 to-blue-600/5" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20", ring: "from-purple-500/20 to-purple-600/5" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", ring: "from-amber-500/20 to-amber-600/5" },
  red: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", ring: "from-red-500/20 to-red-600/5" },
};

function SnapshotCard({ card, props, index }) {
  const Icon = card.icon;
  const value = card.getValue(props);
  const sub = card.getSub(props);
  const colorKey = typeof card.color === "function" ? card.color(props) : card.color;
  const colors = colorMap[colorKey] || colorMap.blue;
  const trend = typeof card.trend === "function" ? card.trend(props) : card.trend;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", colors.ring)} />
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-foreground/[0.02] rounded-full blur-3xl group-hover:bg-primary/5 transition-colors duration-500" />

      <div className="relative z-10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
            colors.bg, colors.text, colors.border
          )}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                trend === "up"
                  ? "text-emerald-500 bg-emerald-500/10"
                  : "text-red-500 bg-red-500/10"
              )}
            >
              <TrendingUp className={cn("h-3 w-3", trend === "down" && "rotate-180")} />
              {trend === "up" ? "Rising" : "Cooling"}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">
            {card.label}
          </p>
          <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight truncate">{value}</p>
          {sub && (
            <p className="text-xs text-muted-foreground font-medium mt-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary/40" />
              {sub}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AnalyticsSnapshot(props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Analytics Snapshot</h2>
          <p className="text-sm text-muted-foreground">Real-time career metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {snapshotCards.map((card, i) => (
          <SnapshotCard key={card.key} card={card} props={props} index={i} />
        ))}
      </div>
    </div>
  );
}
