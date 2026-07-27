"use client";

import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";

export function StreakCard({ streak = 0, weeklyCount = 0 }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <Flame className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Streak</p>
          <p className="text-3xl font-extrabold text-foreground">{streak} {streak === 1 ? "day" : "days"}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">This Week</p>
          <p className="text-3xl font-extrabold text-foreground">{weeklyCount} {weeklyCount === 1 ? "action" : "actions"}</p>
        </div>
      </motion.div>
    </div>
  );
}