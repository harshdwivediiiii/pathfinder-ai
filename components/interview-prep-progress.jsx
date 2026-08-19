"use client";

import {
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Target,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function InterviewPrepProgress({ stats }) {
  const {
    questionsAttempted = 0,
    correctAnswers = 0,
    mockInterviewsCompleted = 0,
    readinessScore = 0,
    weekly = [],
  } = stats || {};

  const safeReadiness = Math.min(
    100,
    Math.max(0, Number(readinessScore) || 0)
  );

  const accuracy =
    questionsAttempted > 0
      ? Math.round((correctAnswers / questionsAttempted) * 100)
      : 0;

  const getReadinessLabel = () => {
    if (safeReadiness >= 80) {
      return "Interview ready";
    }

    if (safeReadiness >= 60) {
      return "On track";
    }

    return "Getting started";
  };

  const chartData = Array.isArray(weekly)
    ? weekly.map((item) => ({
        week: item.week,
        avgScore: Number(item.avgScore) || 0,
      }))
    : [];

  return (
    <section
      id="interview-prep"
      className="rounded-2xl border border-border/50 bg-card shadow-soft overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Interview Preparation
              </h2>

              <p className="text-sm text-muted-foreground">
                Track your interview practice and readiness
              </p>
            </div>
          </div>

          <Badge variant="secondary">
            {getReadinessLabel()}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Questions Attempted
                </p>

                <p className="text-xl font-bold">
                  {questionsAttempted}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Correct Answers
                </p>

                <p className="text-xl font-bold">
                  {correctAnswers}
                </p>

                <p className="text-xs text-muted-foreground">
                  {accuracy}% accuracy
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                <Target className="h-5 w-5 text-orange-600" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Mock Interviews
                </p>

                <p className="text-xl font-bold">
                  {mockInterviewsCompleted}
                </p>

                <p className="text-xs text-muted-foreground">
                  completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Score */}
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />

                <h3 className="font-semibold">
                  Overall Readiness
                </h3>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Based on your interview practice and performance
              </p>
            </div>

            <span className="text-2xl font-bold">
              {safeReadiness}%
            </span>
          </div>

          <Progress
            value={safeReadiness}
            aria-label={`Interview readiness score: ${safeReadiness}%`}
            className="h-2"
          />
        </div>

        {/* Weekly Progress */}
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-4">
            <h3 className="font-semibold">
              Weekly Progress
            </h3>

            <p className="text-xs text-muted-foreground">
              Your average interview score over time
            </p>
          </div>

          {chartData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    name="Average Score"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />

                <p className="text-sm font-medium">
                  No weekly data yet
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Complete some interview practice to see your progress.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}