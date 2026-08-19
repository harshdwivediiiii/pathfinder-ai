"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  GraduationCap,
  Award,
} from "lucide-react";

interface TiltedResumeCardProps {
  className?: string;
}

export function TiltedResumeCard({ className = "" }: TiltedResumeCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setRotateY(x * 14);
      setRotateX(-y * 14);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[480px] lg:h-[560px] flex items-center justify-center ${className}`}
      style={{ perspective: "1200px" }}
    >
      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-gradient-to-br from-violet-600/25 via-transparent to-blue-600/15 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute top-1/4 right-1/4 w-[260px] h-[260px] bg-gradient-to-br from-blue-500/15 via-transparent to-purple-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[200px] h-[200px] bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-full blur-[60px]" />
      </div>

      {/* Floating card wrapper */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          initial={{ opacity: 0, x: 80, rotateZ: 0 }}
          animate={{ opacity: 1, x: 0, rotateZ: -8 }}
          transition={{
            duration: 1,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.5,
          }}
        >
          <motion.div
            animate={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            transition={{ type: "spring", stiffness: 120, damping: 30 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Glow behind card */}
            <div className="absolute -inset-5 rounded-3xl bg-gradient-to-br from-violet-600/35 via-blue-600/20 to-transparent blur-3xl -z-10 opacity-80 resume-card-glow transition-shadow duration-700" />

            {/* Main card */}
            <div className="relative w-80 sm:w-[360px] rounded-3xl p-7 overflow-hidden liquid-glass-card group">
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5" />

              {/* ATS Score Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -top-1 -right-1 z-20"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-green-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold">
                  92% Match
                </div>
              </motion.div>

              {/* Card content */}
              <div className="relative z-10 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    HD
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Harshvardhan Dwivedi
                    </h3>
                    <p className="text-xs text-white/50">AI/ML Engineer</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
                    Core Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["React", "Next.js", "AI/ML", "Kubernetes"].map(
                      (skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
                    Experience
                  </p>
                  <div className="flex items-start gap-2.5">
                    <Briefcase className="h-3.5 w-3.5 text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white/80">
                        Senior AI Engineer
                      </p>
                      <p className="text-[10px] text-white/40">
                        TechCorp · 2022–Present
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Briefcase className="h-3.5 w-3.5 text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white/80">
                        ML Engineer
                      </p>
                      <p className="text-[10px] text-white/40">
                        DataFlow Inc. · 2020–2022
                      </p>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
                    Education
                  </p>
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="h-3.5 w-3.5 text-white/30 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white/80">
                        M.Tech in AI & ML
                      </p>
                      <p className="text-[10px] text-white/40">
                        IIT Bombay · 2020
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project highlights */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
                    Key Projects
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-emerald-400/70 shrink-0" />
                      <p className="text-[11px] text-white/60">
                        Open-source RAG framework — 2.4k GitHub stars
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-blue-400/70 shrink-0" />
                      <p className="text-[11px] text-white/60">
                        Real-time ML pipeline on Kubernetes at scale
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
                  {[
                    { label: "Match", value: "92%", color: "text-emerald-400" },
                    {
                      label: "Keywords",
                      value: "28/30",
                      color: "text-blue-400",
                    },
                    {
                      label: "Format",
                      value: "A+",
                      color: "text-violet-400",
                    },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center">
                      <p className={`text-sm font-bold ${metric.color}`}>
                        {metric.value}
                      </p>
                      <p className="text-[9px] text-white/35">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
