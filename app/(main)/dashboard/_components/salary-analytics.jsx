"use client";

import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Sparkles,
  Briefcase,
  Info,
} from "lucide-react";
import { cn } from "@/lib/misc/utils";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0]?.payload;
  if (!entry) return null;

  return (
    <div className="glass p-5 rounded-2xl border border-border/50 shadow-glass-lg backdrop-blur-xl min-w-[240px]">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/20">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
          <Briefcase className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div>
          <p className="font-bold text-foreground text-sm leading-tight">{entry.role}</p>
          {entry.location && (
            <p className="text-[10px] text-muted-foreground font-medium">{entry.location}</p>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_6px_oklch(0.6_0.15_200)]" />
            <span className="text-[11px] font-semibold text-muted-foreground">Median</span>
          </div>
          <span className="text-sm font-black text-foreground tabular-nums">
            {formatCurrency(entry.median)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-muted-foreground">Maximum</span>
          </div>
          <span className="text-sm font-bold text-emerald-500 tabular-nums">
            {formatCurrency(entry.max)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-[11px] font-semibold text-muted-foreground">Minimum</span>
          </div>
          <span className="text-sm font-bold text-slate-400 tabular-nums">
            {formatCurrency(entry.min)}
          </span>
        </div>

        <div className="pt-2.5 mt-1 border-t border-border/20">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium text-muted-foreground">Range Spread</span>
            <span className="font-bold text-foreground/70 tabular-nums">
              {formatCompact(entry.max - entry.min)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartLegend({ payload }) {
  if (!payload) return null;

  const labels = {
    median: "Median Salary",
    max: "Max Range",
    min: "Min Range",
  };

  const icons = {
    median: "bg-cyan-500 shadow-[0_0_6px_oklch(0.6_0.15_200)]",
    max: "bg-emerald-500",
    min: "bg-slate-500",
  };

  return (
    <div className="flex items-center justify-center gap-6 pt-2">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", icons[entry.dataKey] || "bg-primary")} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {labels[entry.dataKey] || entry.dataKey}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SalaryAnalytics({ insight }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const salaryRanges = insight?.salaryRanges || [];

  if (!salaryRanges.length) return null;

  const globalMax = Math.max(...salaryRanges.map((r) => r.max));
  const globalMin = Math.min(...salaryRanges.map((r) => r.min));
  const avgMedian = Math.round(
    salaryRanges.reduce((a, r) => a + r.median, 0) / salaryRanges.length
  );
  const topRole = salaryRanges.reduce((a, b) => (a.median > b.median ? a : b));

  const chartData = salaryRanges.map((r) => ({
    ...r,
    role: r.role.length > 14 ? r.role.slice(0, 14) + "…" : r.role,
    fullRole: r.role,
  }));

  const yMax = Math.ceil(globalMax / 50000) * 50000;

  const handleMouseMove = (e) => {
    if (e?.activeTooltipIndex !== undefined) setHoveredIndex(e.activeTooltipIndex);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Salary Intelligence</h2>
          <p className="text-sm text-muted-foreground">Benchmark compensation across roles</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider text-cyan-500">
          <Sparkles className="h-3 w-3" />
          Live Data
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-border/50 bg-card shadow-soft overflow-hidden">
        {/* KPI Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/20 border-b border-border/20">
          {[
            {
              label: "Roles Tracked",
              value: salaryRanges.length,
              icon: Briefcase,
              color: "text-cyan-500",
              bgColor: "bg-cyan-500/10 border-cyan-500/20",
            },
            {
              label: "Salary Range",
              value: `${formatCompact(globalMin)} – ${formatCompact(globalMax)}`,
              icon: TrendingUp,
              color: "text-emerald-500",
              bgColor: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              label: "Avg. Median",
              value: formatCurrency(avgMedian),
              icon: DollarSign,
              color: "text-blue-500",
              bgColor: "bg-blue-500/10 border-blue-500/20",
            },
            {
              label: "Highest Paying",
              value: topRole.role.length > 14 ? topRole.role.slice(0, 14) + "…" : topRole.role,
              icon: Sparkles,
              color: "text-purple-500",
              bgColor: "bg-purple-500/10 border-purple-500/20",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 md:p-5 flex items-center gap-3"
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center border shrink-0",
                    stat.bgColor
                  )}
                >
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-sm font-black text-foreground truncate">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Chart Section */}
        <div className="p-6 md:p-8">
          <div className="relative">
            {/* Ambient glow behind chart */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-gradient-to-b from-cyan-500/[0.04] to-transparent rounded-full blur-[80px] pointer-events-none" />

            <div className="h-72 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <defs>
                    <linearGradient id="medianAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.6 0.15 200 / 0.3)" />
                      <stop offset="40%" stopColor="oklch(0.6 0.15 200 / 0.12)" />
                      <stop offset="100%" stopColor="oklch(0.6 0.15 200 / 0.02)" />
                    </linearGradient>
                    <linearGradient id="medianLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="oklch(0.65 0.18 220)" />
                      <stop offset="50%" stopColor="oklch(0.6 0.15 200)" />
                      <stop offset="100%" stopColor="oklch(0.55 0.2 250)" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="oklch(var(--border) / 0.12)"
                  />

                  <XAxis
                    dataKey="role"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "oklch(var(--muted-foreground))",
                    }}
                    dy={8}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "oklch(var(--muted-foreground))",
                    }}
                    tickFormatter={(val) => formatCompact(val)}
                    domain={[0, yMax]}
                    ticks={[0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax]}
                  />

                  <Tooltip
                    cursor={{
                      stroke: "oklch(var(--primary) / 0.08)",
                      strokeDasharray: "4 4",
                      strokeWidth: 1,
                    }}
                    content={<CustomTooltip />}
                  />

                  <Legend content={<ChartLegend />} />

                  <ReferenceLine
                    y={avgMedian}
                    stroke="oklch(var(--primary) / 0.15)"
                    strokeDasharray="6 4"
                    strokeWidth={1}
                    label={{
                      value: "Avg Median",
                      position: "insideTopRight",
                      fontSize: 9,
                      fill: "oklch(var(--muted-foreground))",
                      fontWeight: 600,
                    }}
                  />

                  {/* Gradient area under median */}
                  <Area
                    type="monotone"
                    dataKey="median"
                    stroke="none"
                    fill="url(#medianAreaGrad)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />

                  {/* Max range line */}
                  <Line
                    type="monotone"
                    dataKey="max"
                    stroke="oklch(0.65 0.18 150)"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="5 3"
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />

                  {/* Median primary line */}
                  <Line
                    type="monotone"
                    dataKey="median"
                    stroke="url(#medianLineGrad)"
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, index } = props;
                      const isHovered = hoveredIndex === index;
                      return (
                        <g>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 6 : 0}
                            fill="oklch(0.6 0.15 200 / 0.15)"
                            stroke="none"
                          >
                            <animate
                              attributeName="r"
                              from="0"
                              to={isHovered ? 6 : 0}
                              dur="0.3s"
                              fill="freeze"
                            />
                          </circle>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 4 : 3}
                            fill={
                              isHovered
                                ? "oklch(0.6 0.15 200)"
                                : "oklch(0.65 0.18 220)"
                            }
                            stroke={
                              isHovered
                                ? "oklch(0.6 0.15 200 / 0.3)"
                                : "oklch(var(--card))"
                            }
                            strokeWidth={isHovered ? 2 : 1.5}
                          >
                            <animate
                              attributeName="r"
                              from="3"
                              to={isHovered ? 4 : 3}
                              dur="0.3s"
                              fill="freeze"
                            />
                          </circle>
                        </g>
                      );
                    }}
                    activeDot={{
                      r: 5,
                      fill: "oklch(0.6 0.15 200)",
                      stroke: "oklch(var(--card))",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />

                  {/* Min range line */}
                  <Line
                    type="monotone"
                    dataKey="min"
                    stroke="oklch(0.55 0.04 250)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Chart info hint */}
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground/50 font-medium justify-center">
              <Info className="h-3 w-3" />
              Hover over the chart to explore salary data
            </div>
          </div>

          {/* Salary Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
            {salaryRanges.map((data, i) => (
              <motion.div
                key={data.role}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "group relative p-4 rounded-2xl border transition-all duration-300 cursor-default overflow-hidden",
                  hoveredIndex === i
                    ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/[0.03] via-card to-blue-500/[0.03] shadow-lg shadow-cyan-500/5"
                    : "border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-border/60"
                )}
              >
                {/* Hover gradient overlay */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                    "bg-gradient-to-br from-cyan-500/[0.02] via-transparent to-blue-500/[0.02]"
                  )}
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{data.role}</p>
                      {data.location && (
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                          {data.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-black text-cyan-500 tabular-nums shrink-0">
                      {formatCurrency(data.median)}
                    </div>
                  </div>

                  {/* Animated fill bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((data.median - globalMin) / (globalMax - globalMin || 1)) * 100}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500/40 to-cyan-500"
                    />
                  </div>

                  {/* Min/Max range */}
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                      {formatCurrency(data.min)}
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                      Range
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                      {formatCurrency(data.max)}
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
