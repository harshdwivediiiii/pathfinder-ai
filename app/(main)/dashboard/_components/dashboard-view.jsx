"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, MapPin, Clock3, Link2, Sparkles, BarChart3, Target } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DashboardView({ insights, atsAnalyses = [] }) {
  const isGrounded = Boolean(insights?.isGrounded);
  const lastUpdatedLabel = insights?.lastUpdated
    ? formatDistanceToNow(new Date(insights.lastUpdated), { addSuffix: true })
    : null;

  const chartData = atsAnalyses
    .slice()
    .reverse()
    .map((analysis) => ({
      name: format(new Date(analysis.createdAt), "MMM d"),
      score: analysis.atsScore,
      fullDate: format(new Date(analysis.createdAt), "PPP"),
    }))
    .slice(-10);

  const renderCitationLinks = (citations = []) => {
    if (!citations.length) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {citations.map((citation) => (
          <a
            key={citation.uri}
            href={citation.uri}
            target="_blank"
            rel="noreferrer"
            className="group/link"
          >
            <Badge variant="outline" className="rounded-full text-[10px] font-bold py-0 h-5 border-border/50 bg-muted/30 group-hover/link:bg-primary/10 group-hover/link:text-primary group-hover/link:border-primary/30 transition-all">
              <Link2 className="mr-1 h-2.5 w-2.5" />
              {citation.title || "Source"}
            </Badge>
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            label: "Market Demand", 
            value: insights?.demandLevel || "Stable", 
            icon: Target,
            trend: insights?.demandLevel === "High" ? "up" : "stable",
            color: "text-blue-500 bg-blue-500/10"
          },
          { 
            label: "Growth Rate", 
            value: insights?.growthRate ? `${insights.growthRate}%` : "5.2%", 
            icon: TrendingUp,
            trend: "up",
            color: "text-emerald-500 bg-emerald-500/10"
          },
          { 
            label: "Hot Location", 
            value: insights?.salaryRanges?.[0]?.location || "Remote", 
            icon: MapPin,
            trend: "none",
            color: "text-purple-500 bg-purple-500/10"
          }
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl border border-border bg-card shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${metric.color}`}>
                <metric.icon className="h-5 w-5" />
              </div>
              {metric.trend === "up" && <Badge className="bg-emerald-500/10 text-emerald-500 border-0">High</Badge>}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-2xl font-black text-foreground">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ATS Progress Card */}
        <Card className="rounded-[2.5rem] border-border shadow-lg overflow-hidden flex flex-col">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <CardTitle className="text-xl font-bold">ATS Score Evolution</CardTitle>
            </div>
            <CardDescription>Visualizing your resume optimization journey over time.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex-grow h-64 min-h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border) / 0.5)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass p-3 rounded-2xl border border-white/20 shadow-xl text-xs">
                            <p className="font-bold text-foreground mb-1">{payload[0].payload.fullDate}</p>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <p className="font-black text-primary">Score: {payload[0].value}%</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="var(--primary)" 
                    strokeWidth={4}
                    dot={{ r: 4, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--background)" }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <p className="text-sm text-muted-foreground max-w-[200px]">No scans yet. Start by optimizing your first resume!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industry Intelligence Card */}
        <Card className="rounded-[2.5rem] border-border shadow-lg overflow-hidden flex flex-col">
          <CardHeader className="p-8 pb-4 flex flex-row items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <CardTitle className="text-xl font-bold">Salary Benchmarks</CardTitle>
              </div>
              <CardDescription>Competitive intelligence for your role.</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                isGrounded ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-primary/5 text-primary border-primary/20"
              )}>
                {isGrounded ? "Grounded AI" : "AI Predicted"}
              </Badge>
              {lastUpdatedLabel && (
                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {lastUpdatedLabel}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6 flex-grow">
            {insights?.salaryRanges?.length > 0 ? (
              <>
                <div className="h-48 min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights.salaryRanges}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border) / 0.5)" />
                      <XAxis dataKey="role" hide />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "oklch(var(--primary) / 0.05)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass p-4 rounded-2xl border border-white/20 shadow-xl text-xs max-w-[240px]">
                                <p className="font-black text-foreground mb-1 truncate">{data.role}</p>
                                <div className="space-y-1 mb-2">
                                  <p className="text-muted-foreground flex justify-between">Median: <span className="font-bold text-foreground">${data.median.toLocaleString()}</span></p>
                                  <p className="text-muted-foreground flex justify-between text-[10px]">Range: <span>${data.min.toLocaleString()} - ${data.max.toLocaleString()}</span></p>
                                </div>
                                <div className="pt-2 border-t border-border/50">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</p>
                                  <p className="text-[11px] font-medium">{data.location}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="median" radius={[12, 12, 12, 12]} barSize={40}>
                        {insights.salaryRanges.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? "var(--primary)" : "oklch(var(--primary) / 0.4)"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {insights.salaryRanges.map((data, i) => (
                    <div key={i} className="group p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h5 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{data.role}</h5>
                        <div className="text-right">
                          <p className="text-sm font-black text-foreground">${data.median.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">Median</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {data.location}
                        </div>
                        <span className="font-mono text-[10px]">${data.min.toLocaleString()} - ${data.max.toLocaleString()}</span>
                      </div>
                      {renderCitationLinks(data.citations)}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <p className="text-sm text-muted-foreground">Industry data is currently unavailable.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Skills Card */}
        <Card className="rounded-[2.5rem] border-border shadow-lg">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Critical Skills to Master
            </CardTitle>
            <CardDescription>Top in-demand skills for your current industry profile.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="flex flex-wrap gap-2">
              {insights?.topSkills?.map((skill, i) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Badge variant="secondary" className="px-4 py-2 rounded-xl border border-border bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-default text-sm font-bold">
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Outlook Card */}
        <Card className="rounded-[2.5rem] border-border shadow-lg bg-primary/[0.02]">
          <CardHeader className="p-8">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Industry Outlook</CardTitle>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>AI-generated perspective on market trends.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="relative p-6 rounded-3xl bg-background border border-border shadow-inner">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{insights?.marketOutlook || "Maintain focus on skill acquisition to remain competitive in an evolving marketplace."}"
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-px bg-border flex-grow" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">PathFinder Intelligence</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
