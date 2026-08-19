"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Code2,
  Map,
  ArrowRight,
  Sparkles,
  Briefcase,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/misc/utils";

const certifications = [
  {
    name: "AWS Certified Solutions Architect",
    provider: "Amazon Web Services",
    url: "https://aws.amazon.com/certification/",
    difficulty: "Advanced",
  },
  {
    name: "Google Professional Cloud Architect",
    provider: "Google Cloud",
    url: "https://cloud.google.com/learn/certification",
    difficulty: "Advanced",
  },
  {
    name: "Certified Kubernetes Administrator",
    provider: "CNCF",
    url: "https://www.cncf.io/certification/cka/",
    difficulty: "Intermediate",
  },
];

const learningRoadmap = [
  { phase: "Foundation", skills: "Core concepts & tooling", duration: "1-2 months" },
  { phase: "Intermediate", skills: "Build real projects", duration: "2-3 months" },
  { phase: "Advanced", skills: "System design & architecture", duration: "3-4 months" },
  { phase: "Mastery", skills: "Specialization & leadership", duration: "Ongoing" },
];

const suggestedProjects = [
  {
    title: "Build a portfolio platform",
    desc: "Showcase your skills with a full-stack application",
    icon: Code2,
  },
  {
    title: "Open source contribution",
    desc: "Contribute to projects aligned with your target role",
    icon: Star,
  },
  {
    title: "Data-driven side project",
    desc: "Apply analytics skills to a real-world dataset",
    icon: Briefcase,
  },
];

const difficultyColors = {
  Advanced: "text-red-500 bg-red-500/10 border-red-500/20",
  Intermediate: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Beginner: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

export function AiRecommendations({ insight, currentRole, targetRole }) {
  const recommendedCerts = useMemo(() => {
    const industry = insight?.industry || "";
    if (industry.toLowerCase().includes("tech")) return certifications;
    return [
      { name: "Project Management Professional (PMP)", provider: "PMI", url: "https://www.pmi.org/certifications/project-management-pmp", difficulty: "Advanced" },
      { name: "Certified ScrumMaster", provider: "Scrum Alliance", url: "https://www.scrumalliance.org/get-certified", difficulty: "Intermediate" },
      { name: "Industry-specific certification", provider: "Varies", url: "#", difficulty: "Varies" },
    ];
  }, [insight]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary via-purple-500 to-pink-500" />
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">AI Career Compass</h2>
            <p className="text-sm text-muted-foreground">Personalized growth recommendations</p>
          </div>
          <Sparkles className="h-4 w-4 text-primary/60 -mt-4" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-amber-500/[0.03] rounded-full blur-3xl group-hover:bg-amber-500/[0.06] transition-colors duration-500" />
          <div className="relative z-10 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 transition-transform duration-300 group-hover:scale-110">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Certifications</h3>
                <p className="text-xs text-muted-foreground">Boost your credentials</p>
              </div>
            </div>

            <div className="space-y-3">
              {recommendedCerts.map((cert, i) => (
                <motion.a
                  key={cert.name}
                  href={cert.url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group/cert block p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-primary/40 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground group-hover/cert:text-primary transition-colors">
                        {cert.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cert.provider}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full text-[10px] font-bold shrink-0 border",
                        difficultyColors[cert.difficulty] || "border-border/30 text-muted-foreground"
                      )}
                    >
                      {cert.difficulty}
                    </Badge>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Learning Roadmap */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-blue-500/[0.03] rounded-full blur-3xl group-hover:bg-blue-500/[0.06] transition-colors duration-500" />
          <div className="relative z-10 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Learning Roadmap</h3>
                <p className="text-xs text-muted-foreground">Structured path to mastery</p>
              </div>
            </div>

            <div className="relative pl-7">
              {learningRoadmap.map((phase, i) => (
                <div key={phase.phase} className="relative pb-7 last:pb-0">
                  {i < learningRoadmap.length - 1 && (
                    <div className="absolute left-0 top-3 bottom-0 w-px bg-gradient-to-b from-primary/40 to-primary/5" />
                  )}
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-background group-hover:bg-primary/20 transition-colors duration-300" />
                  <div className="ml-8">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">{phase.phase}</span>
                      <Badge variant="outline" className="rounded-full text-[9px] font-medium px-2 py-0 h-4 border-border/30 bg-muted/20">
                        {phase.duration}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{phase.skills}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Suggested Projects */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-purple-500/[0.03] rounded-full blur-3xl group-hover:bg-purple-500/[0.06] transition-colors duration-500" />
          <div className="relative z-10 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 transition-transform duration-300 group-hover:scale-110">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Projects</h3>
                <p className="text-xs text-muted-foreground">Build your portfolio</p>
              </div>
            </div>

            <div className="space-y-3">
              {suggestedProjects.map((project, i) => {
                const Icon = project.icon;
                return (
                  <motion.div
                    key={project.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{project.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{project.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Link
              href="/project-ideas"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors group/link"
            >
              Get personalized project ideas
              <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>

        {/* Career Progression */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-emerald-500/[0.03] rounded-full blur-3xl group-hover:bg-emerald-500/[0.06] transition-colors duration-500" />
          <div className="relative z-10 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 transition-transform duration-300 group-hover:scale-110">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Career Progression</h3>
                <p className="text-xs text-muted-foreground">Your growth trajectory</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border/40 bg-muted/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Current
                </p>
                <p className="text-sm font-bold text-foreground">
                  {currentRole || "Professional"}
                </p>
              </div>

              <div className="flex justify-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-primary/30 bg-primary/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Target
                </p>
                <p className="text-sm font-bold text-foreground">
                  {targetRole || "Senior Professional"}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Recommended Path
                </p>
                <div className="space-y-2">
                  {[
                    { text: "Build expertise in core skills", icon: CheckCircle2 },
                    { text: "Take on leadership opportunities", icon: CheckCircle2 },
                    { text: "Expand network & influence", icon: CheckCircle2 },
                  ].map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.text} className="flex items-center gap-2.5 text-xs text-muted-foreground group/step">
                        <div className="h-2 w-2 rounded-full bg-primary/30 group-hover/step:bg-primary/60 transition-colors" />
                        {step.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <Link
              href="/roadmap"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors group/link"
            >
              View full career roadmap
              <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
