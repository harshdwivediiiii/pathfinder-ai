"use client";

import {
  FileText,
  Mail,
  ScanSearch,
  Mic,
  Map,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const activityConfig = [
  {
    key: "resumeEdits",
    label: "Resume Edits",
    icon: FileText,
  },
  {
    key: "coverLetters",
    label: "Cover Letters",
    icon: Mail,
  },
  {
    key: "atsAnalyses",
    label: "ATS Analyses",
    icon: ScanSearch,
  },
  {
    key: "mockInterviews",
    label: "Mock Interviews",
    icon: Mic,
  },
  {
    key: "roadmaps",
    label: "Career Roadmaps",
    icon: Map,
  },
  {
    key: "totalAiInteractions",
    label: "AI Interactions",
    icon: Sparkles,
  },
];

const colorMap = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    ring: "ring-blue-500/10",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-500",
    border: "border-purple-500/20",
    ring: "ring-purple-500/10",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-500",
    border: "border-green-500/20",
    ring: "ring-green-500/10",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500/20",
    ring: "ring-orange-500/10",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-500",
    border: "border-pink-500/20",
    ring: "ring-pink-500/10",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-500",
    border: "border-yellow-500/20",
    ring: "ring-yellow-500/10",
  },
};

const colors = ["blue", "purple", "green", "orange", "pink", "yellow"];

export default function WeeklyActivitySummary({
  weeklySummary = null,
}) {
  const summary = weeklySummary?.data ?? weeklySummary ?? {};

  return (
    <section className="space-y-5">
      {/* Section Header */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="p-5">
          <h2 className="text-xl font-bold tracking-tight">
            Weekly Activity
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Your career progress over the last 7 days
          </p>
        </div>
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activityConfig.map((activity, index) => {
          const Icon = activity.icon;
          const value = Number(summary?.[activity.key] ?? 0);
          const color = colorMap[colors[index]];

          return (
            <motion.div
              key={activity.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.08,
              }}
              aria-label={`${activity.label}: ${value}`}
              className={`rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-md ${color.border}`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${color.bg} ${color.text} ring-4 ${color.ring}`}
                >
                  <Icon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <span className="text-2xl font-bold">
                  {value}
                </span>
              </div>

              <div className="mt-4">
                <p className="font-medium">
                  {activity.label}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}