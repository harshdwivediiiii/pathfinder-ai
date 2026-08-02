"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Play,
  FileText,
  Brain,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Users,
  BarChart3,
  X,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { BlurText } from "@/components/BlurText";
import { FadingVideo } from "@/components/FadingVideo";
import {
  Briefcase,
  GraduationCap,
  Award,
  Check,
} from "lucide-react";
import { OpenSourceCommunity } from "@/components/sections/OpenSourceCommunity";
import Footer from "@/components/Footer";
import { GlobalScrollTracker } from "@/components/GlobalScrollTracker";
import { CareerScrollWrapper } from "@/components/scrollytelling";

/* ──────────────────────────────────────────────────────────────
   TYPEWRITER HOOK
   ────────────────────────────────────────────────────────────── */

function useTypewriter(text: string, speed = 55, startDelay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let idx = 0;
    let timeout: NodeJS.Timeout;

    const startTimeout = setTimeout(() => {
      const type = () => {
        if (idx < text.length) {
          setDisplayed(text.slice(0, idx + 1));
          idx++;
          timeout = setTimeout(type, speed + Math.random() * 30);
        } else {
          setDone(true);
        }
      };
      type();
    }, startDelay);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

/* ──────────────────────────────────────────────────────────────
   FLOATING GLASS NAVBAR
   ────────────────────────────────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Interviews", href: "#interviews" },
    { label: "Resumes", href: "#resumes" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
      >
        <div
          className={`glass-pill rounded-full px-5 py-3 flex items-center justify-between transition-all duration-500 ${
            scrolled
              ? "shadow-xl shadow-black/30 border-white/[0.12]"
              : "border-white/[0.08]"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              PathFinder AI{" "}
              <span className="text-violet-400 text-xs">✦</span>
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[13px] font-medium text-white/50 hover:text-white/90 transition-colors duration-300"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/sign-up"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 px-5 py-2 rounded-full transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.03]"
            >
              Start Free
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-[72px] left-4 right-4 z-50 md:hidden"
          >
            <div className="glass-pill rounded-2xl p-5 space-y-1">
              {navLinks.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] px-4 py-3 rounded-xl transition-all duration-200"
                >
                  {item.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="pt-2 border-t border-white/[0.06]"
              >
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 rounded-xl transition-all duration-300"
                >
                  Start Free
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   TRUST LOGOS
   ────────────────────────────────────────────────────────────── */

function TrustLogos() {
  const logos = ["GitHub", "Google", "Microsoft", "AWS", "Open Source"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.8 }}
      className="flex flex-col items-center gap-5 mt-16"
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/20 font-medium">
        Trusted by engineers at
      </p>
      <div className="flex items-center gap-8 md:gap-12 flex-wrap justify-center">
        {logos.map((name, i) => (
          <motion.span
            key={name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0 + i * 0.1, duration: 0.6 }}
            className="text-sm md:text-base font-semibold text-white/15 hover:text-white/35 transition-colors duration-500 select-none tracking-wide"
          >
            {name}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   HERO SECTION
   ────────────────────────────────────────────────────────────── */

function HeroSection() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDemoOpen(false);
      }
    };
    if (isDemoOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDemoOpen]);

  const { displayed, done } = useTypewriter(
    "Build a Resume That Gets Interviews",
    50,
    800
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Cinematic background video */}
      <FadingVideo />

      {/* Content — single column, centered */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-semibold tracking-wide text-violet-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
            </span>
            New &bull; AI Career Intelligence Suite
          </span>
        </motion.div>

        {/* Headline with typewriter */}
        <div className="mt-8 min-h-[7rem] sm:min-h-[9rem] md:min-h-[10rem]">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-bold leading-[1.08] tracking-tight text-white">
            <span>{displayed}</span>
            <span
              className="inline-block w-[3px] h-[0.85em] bg-violet-400 ml-1 align-baseline animate-caret"
            />
          </h1>
        </div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-6 text-base sm:text-lg text-white/50 max-w-xl mx-auto md:mx-0 leading-relaxed font-light"
        >
          PathFinder AI helps you create ATS-optimized resumes, prepare for
          interviews, improve LinkedIn visibility, and map a career path
          that aligns with your goals.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/sign-up"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-sm font-bold text-white shadow-xl shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.03]"
          >
            Start Building Free
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <button
            onClick={() => setIsDemoOpen(true)}
            className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-sm font-semibold text-white/70 hover:text-white/90 transition-all duration-300"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Watch Demo
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">92% ATS Match</p>
              <p className="text-[10px] text-white/35">
                Average Resume Optimization Score
              </p>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">10k+ Users</p>
              <p className="text-[10px] text-white/35">
                Professionals Guided Worldwide
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust logos */}
        <TrustLogos />
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />

      {/* Demo Modal */}
      <AnimatePresence>
        {isDemoOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDemoOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl z-10"
            >
              <button
                onClick={() => setIsDemoOpen(false)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Close demo"
              >
                <X className="h-5 w-5" />
              </button>
              <video
                src="/pathfinder-ai.mp4"
                className="w-full h-full object-cover"
                controls
                autoPlay
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   AI-OPTIMIZED RESUME PREVIEW SECTION
   ────────────────────────────────────────────────────────────── */

function ResumePreviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="resumes"
      ref={ref}
      className="relative py-24 md:py-32 bg-black overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-violet-600/8 via-transparent to-blue-600/5 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header — centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center max-w-2xl mx-auto mb-16 md:mb-20 space-y-5"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
            <FileText className="h-3 w-3" />
            ATS-Optimized Resumes
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.12] tracking-tight text-white">
            See Your Resume Before You{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
              Apply
            </span>
          </h2>

          <p className="text-base md:text-lg text-white/45 leading-relaxed">
            PathFinder AI generates ATS-friendly resumes optimized for real
            hiring systems.
          </p>
        </motion.div>

        {/* Centered resume card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="flex justify-center"
        >
          <div className="relative w-full max-w-sm">
            {/* Glow behind card */}
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-violet-600/25 via-blue-600/10 to-transparent blur-3xl -z-10 opacity-80" />

            {/* Glassmorphism resume card */}
            <div className="relative rounded-3xl p-7 overflow-hidden liquid-glass-card group">
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5" />

              {/* ATS Score Badge */}
              <div className="absolute -top-1 -right-1 z-20">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-green-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold">
                  92% Match
                </div>
              </div>

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
          </div>
        </motion.div>

        {/* Feature bullets below card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10"
        >
          {[
            "ATS scoring against real job descriptions",
            "Keyword gap analysis",
            " recruiter-friendly formatting",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="h-5 w-5 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                <Check className="h-3 w-3 text-violet-400" />
              </div>
              <span className="text-sm text-white/50">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   AI CAPABILITIES SECTION
   ────────────────────────────────────────────────────────────── */

interface CapabilityCardProps {
  icon: React.ReactNode;
  title: string;
  tags: string[];
  body: string;
  gradient: string;
  delay: number;
}

function CapabilityCard({
  icon,
  title,
  tags,
  body,
  gradient,
  delay,
}: CapabilityCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 40, filter: "blur(8px)" }
      }
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="group relative"
    >
      <div className="relative rounded-3xl p-8 h-full liquid-glass-card overflow-hidden">
        {/* Gradient glow on hover */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`}
        />

        <div className="relative z-10 space-y-6">
          {/* Icon */}
          <div
            className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}
          >
            {icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white tracking-tight">
            {title}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-[11px] font-medium text-white/50 bg-white/[0.04] border border-white/[0.06] transition-colors duration-300 group-hover:text-white/65 group-hover:border-white/[0.1]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Body */}
          <p className="text-sm text-white/40 leading-relaxed">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

function CapabilitiesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const capabilities: CapabilityCardProps[] = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Resume & Branding",
      tags: [
        "ATS Analyzer",
        "Resume Builder",
        "LinkedIn Optimizer",
        "Cover Letters",
      ],
      body: "Create resumes that pass ATS filters, strengthen your professional brand, and tailor applications for every role.",
      gradient: "from-violet-500 to-blue-500",
      delay: 0,
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: "Interview Coaching",
      tags: ["Mock Interviews", "Voice Coach", "STAR Builder", "Behavioral Prep"],
      body: "Practice realistic interview scenarios with AI feedback on communication, structure, confidence, and technical responses.",
      gradient: "from-blue-500 to-cyan-500",
      delay: 0.15,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Career Growth",
      tags: [
        "Skill Gap Analyzer",
        "Career Roadmap",
        "Salary Coach",
        "Promotion Coach",
      ],
      body: "Identify the skills you're missing, plan your next move, and make informed decisions about growth, compensation, and career pivots.",
      gradient: "from-emerald-500 to-teal-500",
      delay: 0.3,
    },
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative min-h-screen flex items-center bg-black overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-br from-violet-600/5 via-transparent to-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
        {/* Section header */}
        <div className="max-w-2xl mb-16 md:mb-20 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
              <Sparkles className="h-3 w-3" />
              Capabilities
            </span>
          </motion.div>

          <BlurText
            text="Career intelligence, from application to promotion"
            as="h2"
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight text-white"
            delay={0.2}
            staggerChildren={0.03}
          />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((cap) => (
            <CapabilityCard key={cap.title} {...cap} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   MAIN LANDING PAGE
   ────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Navbar />
      <GlobalScrollTracker />
      <CareerScrollWrapper />
      <ResumePreviewSection />
      <CapabilitiesSection />
      <OpenSourceCommunity />
      <Footer />
    </div>
  );
}
