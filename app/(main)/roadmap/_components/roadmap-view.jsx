"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Calendar, Flag, Target, TrendingUp, Trophy } from "lucide-react";

const PRIORITY_STYLES = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-green-500/10 text-green-500 border-green-500/20",
};

const PRIORITY_ICONS = {
  high: Trophy,
  medium: TrendingUp,
  low: Flag,
};

function MilestoneCard({ milestone, index, total }) {
  const PriorityIcon = PRIORITY_ICONS[milestone.priority] || Flag;

  return (
    <div className="relative flex gap-6 group">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 border-2 transition-all duration-300",
          "bg-primary/10 border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
        )}>
          {index + 1}
        </div>
        {index < total - 1 && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/30 to-transparent min-h-[24px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 min-w-0">
        <Card className="border border-border/30 hover:border-primary/30 transition-all duration-300 shadow-md">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-bold text-foreground">
                {milestone.title}
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {milestone.estimatedDuration}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-bold uppercase tracking-wider", PRIORITY_STYLES[milestone.priority])}
                >
                  <PriorityIcon className="h-3 w-3 mr-1" />
                  {milestone.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {milestone.description}
            </p>

            {milestone.skillsToLearn?.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Skills to learn
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {milestone.skillsToLearn.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="text-[11px] font-medium rounded-lg"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RoadmapView({ roadmap }) {
  const content = roadmap?.content || { milestones: [], totalEstimatedTime: "", summary: "" };
  const milestones = content.milestones || [];
  const completedMilestones = milestones.filter((m) => m.priority === "completed").length;
  const progress = milestones.length > 0
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Summary header */}
      {content.summary && (
        <div className="glass rounded-2xl p-6 border border-border/30 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                Your Career Roadmap
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content.summary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            {content.totalEstimatedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Estimated timeline:</span>
                <span className="font-bold text-foreground">{content.totalEstimatedTime}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Milestones:</span>
              <span className="font-bold text-foreground">{milestones.length}</span>
            </div>
          </div>

          {progress > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Overall progress</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      )}

      {/* Milestones timeline */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            Milestones
          </h3>
          <div className="pt-4">
            {milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.title}
                milestone={milestone}
                index={index}
                total={milestones.length}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
