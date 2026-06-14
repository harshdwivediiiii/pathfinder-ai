"use client";

import { motion } from "framer-motion";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";

const skills = [
  { name: "Technical", current: 72, target: 92 },
  { name: "Communication", current: 64, target: 88 },
  { name: "Leadership", current: 58, target: 84 },
  { name: "Strategy", current: 66, target: 90 },
  { name: "Execution", current: 76, target: 94 },
  { name: "Networking", current: 52, target: 82 },
];

const center = 100;
const maxRadius = 80;
const angleStep = 360 / skills.length;

function polarToCart(angle, radius) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function pointsToPath(points) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ")
    .concat(" Z");
}

export default function SkillGapSection() {
  const currentPoints = skills.map((skill, index) =>
    polarToCart(index * angleStep, (skill.current / 100) * maxRadius)
  );

  const targetPoints = skills.map((skill, index) =>
    polarToCart(index * angleStep, (skill.target / 100) * maxRadius)
  );

  const currentPath = pointsToPath(currentPoints);
  const targetPath = pointsToPath(targetPoints);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              Skill Gap Analysis
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              See exactly what stands between you and your next role.
            </h2>
            <p className="text-lg text-muted-foreground">
              Pathfinder maps your current strengths against target-role expectations and turns gaps into a focused action plan.
            </p>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="flex items-center justify-center relative w-full aspect-square max-w-sm mx-auto">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative w-full h-full flex items-center justify-center glass rounded-full border border-border/50 shadow-2xl p-8">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="currentGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {[0.25, 0.5, 0.75, 1].map((scale, index) => (
                  <motion.circle
                    key={scale}
                    cx={100}
                    cy={100}
                    r={80 * scale}
                    fill="none"
                    stroke="oklch(var(--border) / 0.4)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
                    viewport={{ once: true }}
                    style={{ transformOrigin: "100px 100px" }}
                  />
                ))}

                {skills.map((_, index) => {
                  const point = polarToCart(index * angleStep, maxRadius);

                  return (
                    <motion.line
                      key={index}
                      x1={100}
                      y1={100}
                      x2={point.x}
                      y2={point.y}
                      stroke="oklch(var(--border) / 0.4)"
                      strokeWidth="1"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      viewport={{ once: true }}
                    />
                  );
                })}

                <motion.path
                  d={targetPath}
                  fill="oklch(var(--primary) / 0.05)"
                  stroke="oklch(var(--primary) / 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  viewport={{ once: true }}
                  style={{ transformOrigin: "100px 100px" }}
                />

                <motion.path
                  d={currentPath}
                  fill="url(#currentGradient)"
                  stroke="#60a5fa"
                  strokeWidth="2"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
                  viewport={{ once: true }}
                />

                {currentPoints.map((point, index) => (
                  <motion.circle
                    key={`dot-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    className="fill-background"
                    stroke="#60a5fa"
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.5 + index * 0.1 }}
                    viewport={{ once: true }}
                    style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                  />
                ))}
              </svg>

              {skills.map((skill, index) => {
                const point = polarToCart(index * angleStep, 115);

                return (
                  <motion.div
                    key={skill.name}
                    className="absolute whitespace-nowrap z-10"
                    style={{
                      left: `${(point.x / 200) * 100}%`,
                      top: `${(point.y / 200) * 100}%`,
                      x: "-50%",
                      y: "-50%",
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm text-[10px] font-bold uppercase tracking-widest text-foreground shadow-xl">
                      {skill.name}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <StaggerContainer>
              {skills.map((skill) => {
                const gap = skill.target - skill.current;

                return (
                  <StaggerItem key={skill.name}>
                    <div className="glass rounded-xl p-5 border border-border/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-foreground">{skill.name}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">Current: {skill.current}%</span>
                          <span className="text-primary">Target: {skill.target}%</span>
                          <span className={`font-bold ${gap > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                            Gap: {gap > 0 ? `+${gap}` : gap}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-muted/20"
                          initial={{ width: "0%" }}
                          whileInView={{ width: `${skill.target}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 relative z-10"
                          initial={{ width: "0%" }}
                          whileInView={{ width: `${skill.current}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            <FadeUp delay={0.4}>
              <div className="flex items-center gap-4 justify-center pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary/30 border border-dashed border-primary/50" />
                  <span>Target</span>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
