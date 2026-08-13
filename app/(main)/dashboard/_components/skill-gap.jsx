"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Target, TrendingUp, GraduationCap, AlertCircle, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/misc/utils";

function SkillBadge({ name, variant, index }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-105 hover:shadow-sm",
        variant === "owned"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/15"
          : variant === "recommended"
            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/15"
            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/15"
      )}
    >
      {variant === "owned" && <CheckCircle2 className="h-3 w-3" />}
      {variant === "recommended" && <Target className="h-3 w-3" />}
      {variant === "future" && <TrendingUp className="h-3 w-3" />}
      {name}
    </motion.span>
  );
}

function SkillCategory({ title, description, skills, variant, icon: Icon, color, count }) {
  if (!skills?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft hover:shadow-card-hover transition-all duration-500"
    >
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-foreground/[0.02] rounded-full blur-3xl group-hover:bg-primary/5 transition-colors duration-500" />

      <div className="relative z-10 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shrink-0", color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <Badge variant="secondary" className="rounded-full text-[10px] font-bold px-2 py-0.5 h-5 border border-border/30 bg-muted/30">
                {count || skills.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(skills || []).map((skill, i) => (
            <SkillBadge key={skill} name={skill} variant={variant} index={i} />
          ))}
          {skills.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No skills listed</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function SkillGap({ insight, userSkills = [] }) {
  const currentSkills = useMemo(
    () => (Array.isArray(userSkills) ? userSkills.filter(Boolean) : []),
    [userSkills]
  );
  const recommendedSkills = useMemo(
    () => insight?.recommendedSkills || [],
    [insight]
  );
  const topSkills = useMemo(() => insight?.topSkills || [], [insight]);

  const futureSkills = useMemo(() => {
    const all = [...recommendedSkills, ...topSkills];
    const existing = new Set([...currentSkills.map((s) => s.toLowerCase())]);
    return [...new Set(all)].filter((s) => !existing.has(s.toLowerCase())).slice(0, 6);
  }, [currentSkills, recommendedSkills, topSkills]);

  const gapCount = recommendedSkills.filter(
    (s) => !currentSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
        <div className="flex-1 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Skill Architecture</h2>
            <p className="text-sm text-muted-foreground">Gap analysis & growth roadmap</p>
          </div>
          {gapCount > 0 && (
            <Badge
              variant="outline"
              className="rounded-full text-[10px] font-bold px-3 py-1.5 border-amber-500/20 bg-amber-500/5 text-amber-500 flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {gapCount} gap{gapCount !== 1 ? "s" : ""} to close
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <SkillCategory
          title="Current Arsenal"
          description="Skills you already possess"
          skills={currentSkills}
          variant="owned"
          icon={GraduationCap}
          color="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        />

        <SkillCategory
          title="Next to Master"
          description="Highest-impact skills to acquire"
          skills={recommendedSkills}
          variant="recommended"
          icon={Target}
          color="text-blue-500 bg-blue-500/10 border-blue-500/20"
          count={recommendedSkills.length}
        />

        <SkillCategory
          title="Future Edge"
          description="Emerging skills for long-term advantage"
          skills={futureSkills}
          variant="future"
          icon={Zap}
          color="text-purple-500 bg-purple-500/10 border-purple-500/20"
        />
      </div>
    </div>
  );
}
