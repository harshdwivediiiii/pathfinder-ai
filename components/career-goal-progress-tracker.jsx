"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function CareerGoalProgressTracker({
  milestones = [],
  completedCount,
}) {
  const previousProgress = useRef(0);

  const totalCount = milestones.length;

  const completed =
    typeof completedCount === "number"
      ? completedCount
      : milestones.filter((milestone) => milestone.isCompleted).length;

  const remainingCount = Math.max(totalCount - completed, 0);

  const progress =
    totalCount > 0
      ? Math.round((completed / totalCount) * 100)
      : 0;

  useEffect(() => {
    const wasIncomplete = previousProgress.current < 100;
    const isComplete = progress === 100;

    if (wasIncomplete && isComplete) {
      const celebrate = async () => {
        try {
          const { default: confetti } = await import("canvas-confetti");

          confetti({
            particleCount: 100,
            spread: 70,
            origin: {
              y: 0.6,
            },
            disableForReducedMotion: true,
          });
        } catch (error) {
          console.error("Unable to load celebration effect:", error);
        }
      };

      celebrate();
    }

    previousProgress.current = progress;
  }, [progress]);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Career Goal Progress
            </h2>

            <p className="text-sm text-muted-foreground">
              Track your roadmap milestones
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-2xl font-bold">{progress}%</p>
          <p className="text-xs text-muted-foreground">
            Complete
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {completed}/{totalCount} completed
          </span>

          <span>
            {remainingCount} remaining
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={`Career roadmap progress: ${progress}%`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />

          <div>
            <p className="text-sm font-medium">
              Completed
            </p>

            <p className="text-xs text-muted-foreground">
              {completed} milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Circle className="h-5 w-5 text-muted-foreground" />

          <div>
            <p className="text-sm font-medium">
              Remaining
            </p>

            <p className="text-xs text-muted-foreground">
              {remainingCount} milestones
            </p>
          </div>
        </div>
      </div>

      {progress === 100 && totalCount > 0 && (
        <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center">
          <p className="text-sm font-semibold">
            🎉 Career goal completed!
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            You completed all roadmap milestones.
          </p>
        </div>
      )}
    </div>
  );
}