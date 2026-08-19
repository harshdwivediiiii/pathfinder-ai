"use client";

import { motion } from "framer-motion";
import { TrendingUp, Cpu, Users, Lightbulb, ArrowRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/misc/utils";

const sectionConfig = [
  {
    key: "keyTrends",
    label: "Key Market Trends",
    icon: TrendingUp,
    description: "What's shaping the industry right now",
    gradient: "from-blue-500/20 to-cyan-500/10",
    iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    getData: (insight) => insight?.keyTrends || [],
  },
  {
    key: "emergingTechnologies",
    label: "Emerging Technologies",
    icon: Cpu,
    description: "Technologies driving industry change",
    gradient: "from-purple-500/20 to-pink-500/10",
    iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    getData: (insight) => insight?.recommendedSkills || [],
  },
  {
    key: "hiringTrends",
    label: "Hiring Insights",
    icon: Users,
    description: "What employers are looking for",
    gradient: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    getData: (insight) => {
      const trends = [];
      if (insight?.demandLevel) {
        trends.push(
          insight.demandLevel === "High"
            ? "Employers actively competing for talent"
            : insight.demandLevel === "Medium"
              ? "Selective hiring with specialized requirements"
              : "Niche expertise required for most roles"
        );
      }
      if (insight?.topSkills?.length) {
        trends.push(
          `Top skills in demand: ${insight.topSkills.slice(0, 3).join(", ")}`
        );
      }
      if (insight?.growthRate != null && insight.growthRate > 5) {
        trends.push(
          `Growing at ${insight.growthRate}% — new roles emerging quarterly`
        );
      }
      return trends.length ? trends : ["Market data being analyzed"];
    },
  },
];

function TrendCard({ config, insight, index }) {
  const Icon = config.icon;
  const items = config.getData(insight);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", config.gradient)} />
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-foreground/[0.02] rounded-full blur-3xl group-hover:bg-primary/5 transition-colors duration-500" />

      <div className="relative z-10 p-6 md:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg shrink-0", config.iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-bold text-foreground">{config.label}</h3>
              {items.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-muted/40 border border-border/30 text-[9px] font-bold tabular-nums">
                  {items.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {items.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + i * 0.05 }}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/30 group-hover:bg-background/40 transition-colors duration-300"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Lightbulb className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{item}</p>
            </motion.div>
          ))}
        </div>

        {items.length > 4 && (
          <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors group/btn">
            View all {items.length} trends
            <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function IndustryTrends({ insight }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />
        <div className="flex-1 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Industry Trends</h2>
            <p className="text-sm text-muted-foreground">Market intelligence & analysis</p>
          </div>
          {insight?.lastUpdated && (
            <Badge variant="outline" className="rounded-full text-[10px] font-medium px-3 py-1 border-border/50 bg-muted/20">
              <RefreshCw className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {sectionConfig.map((config, i) => (
          <TrendCard key={config.key} config={config} insight={insight} index={i} />
        ))}
      </div>
    </div>
  );
}
