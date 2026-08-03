"use client";

import { motion } from "framer-motion";
import { FileText, Target, Users, SearchCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklySummary({ summary }) {
  if (!summary) return null;

  const { stats, recommendations, hasActivity } = summary;

  if (!hasActivity) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Weekly Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-muted-foreground text-sm font-medium">
            It looks like you haven't been active this past week. Take a small step today to get back on track—generate a new resume or try an interview session!
          </p>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    { label: "Resumes", value: stats.resumes, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Cover Letters", value: stats.coverLetters, icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Interviews", value: stats.interviews, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "ATS Checks", value: stats.ats, icon: SearchCheck, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Your 7-Day Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-muted/50"
              >
                <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black leading-none mb-1">{item.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              AI Focus Areas For Next Week
            </h4>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
