"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Target, MapPin, FileText, Mic, LayoutDashboard, Sparkles } from "lucide-react";

const stages = [
  {
    id: "goal",
    headline: "What's your career goal?",
    subheadline: "Tell us where you want to go, and we'll build a path to get you there.",
    icon: Target,
    stageNum: "01",
  },
  {
    id: "roadmap",
    headline: "AI generates your roadmap",
    subheadline: "A personalized career progression from student to industry leader.",
    icon: MapPin,
    stageNum: "02",
  },
  {
    id: "resume",
    headline: "Premium ATS-ready resume",
    subheadline: "Built for the modern job market. Every keyword, every section, optimized.",
    icon: FileText,
    stageNum: "03",
  },
  {
    id: "interview",
    headline: "AI interview coach",
    subheadline: "Practice with purpose. Get real-time feedback. Land the offer.",
    icon: Mic,
    stageNum: "04",
  },
  {
    id: "dashboard",
    headline: "Your complete career hub",
    subheadline: "Everything you need to accelerate your career, unified in one place.",
    icon: LayoutDashboard,
    stageNum: "05",
  },
];

function GoalStage() {
  const [text, setText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const fullText = "Become a Software Engineer at Google";

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-start justify-center w-full relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => {
          setText("");
          let currentLen = 0;
          const typeInterval = setInterval(() => {
            if (currentLen <= fullText.length) {
              setText(fullText.slice(0, currentLen));
              currentLen += 2;
            } else {
              clearInterval(typeInterval);
            }
          }, 30);
        }}
        className="space-y-8 w-full max-w-3xl"
      >
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Stage 01</span>
          <span className="h-1 w-1 rounded-full bg-blue-500/40" />
          <span className="text-[10px] font-medium text-muted-foreground">Goal Setting</span>
        </div>

        <div className="space-y-4">
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {stages[0].headline}
          </h3>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            {stages[0].subheadline}
          </p>
        </div>

        <div className="relative w-full max-w-xl">
          <div className="glass rounded-2xl p-6 text-left border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.15)] transition-all duration-700 bg-background/50 backdrop-blur-xl">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Your Career Goal
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-medium text-foreground">
                {text || <span className="text-muted-foreground/60">Start typing your goal...</span>}
                {showCursor && (
                  <span className="inline-block w-[2px] h-[1.1em] bg-blue-500 ml-0.5 align-middle animate-pulse" />
                )}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex -space-x-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>AI will personalize everything</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RoadmapStage() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "center center"] });
  const [currentP, setCurrentP] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setCurrentP(latest);
  });

  const milestones = [
    { label: "Student", desc: "Foundation", done: currentP > 0.1 },
    { label: "Intern", desc: "Experience", done: currentP > 0.3 },
    { label: "Junior Dev", desc: "Building", done: currentP > 0.5 },
    { label: "Engineer", desc: "Shipping", done: currentP > 0.7 },
    { label: "Senior", desc: "Leading", done: currentP > 0.9 },
  ];

  const drawProgress = scrollYProgress;
  const nodePositions = milestones.map((_, i) => ({
    x: i % 2 === 0 ? 200 : i === 1 ? 100 : 300,
    y: 50 + i * 60,
  }));

  const pathData = nodePositions.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  return (
    <div ref={ref} className="flex flex-col items-start justify-center w-full relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8 w-full max-w-3xl"
      >
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Stage 02</span>
          <span className="h-1 w-1 rounded-full bg-emerald-500/40" />
          <span className="text-[10px] font-medium text-muted-foreground">Career Roadmap</span>
        </div>

        <div className="space-y-4">
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {stages[1].headline}
          </h3>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            {stages[1].subheadline}
          </p>
        </div>

        <div className="relative w-full max-w-md bg-card/60 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-xl">
          <svg className="w-full h-72 md:h-80" viewBox="0 0 400 340" fill="none">
            <defs>
              <linearGradient id="roadmapActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(var(--primary) / 1)" />
                <stop offset="100%" stopColor="oklch(var(--primary) / 0.3)" />
              </linearGradient>
              <filter id="nodeGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d={pathData}
              stroke="oklch(var(--border) / 0.3)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            <motion.path
              d={pathData}
              stroke="url(#roadmapActive)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              style={{ pathLength: drawProgress }}
            />

            {milestones.map((m, i) => {
              const pos = nodePositions[i];
              const isActive = m.done;
              return (
                <g key={m.label}>
                  {isActive && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="20"
                      fill="none"
                      stroke="oklch(var(--primary) / 0.2)"
                      strokeWidth="4"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${pos.x} ${pos.y}`}
                        to={`360 ${pos.x} ${pos.y}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isActive ? 12 : 8}
                    fill={isActive ? "oklch(var(--primary) / 1)" : "oklch(var(--card) / 1)"}
                    stroke={isActive ? "oklch(var(--primary) / 1)" : "oklch(var(--border) / 0.6)"}
                    strokeWidth="2"
                    style={{ transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
                    filter={isActive ? "url(#nodeGlow)" : "none"}
                  />
                  {isActive && (
                    <circle cx={pos.x} cy={pos.y} r="4" fill="oklch(var(--card) / 1)" />
                  )}
                  <text
                    x={pos.x}
                    y={pos.y + 30}
                    textAnchor="middle"
                    fill={isActive ? "oklch(var(--foreground) / 1)" : "oklch(var(--muted-foreground) / 0.55)"}
                    fontSize="11"
                    fontWeight="700"
                    style={{ transition: "fill 0.5s" }}
                  >
                    {m.label}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 44}
                    textAnchor="middle"
                    fill={isActive ? "oklch(var(--muted-foreground) / 0.8)" : "oklch(var(--muted-foreground) / 0.5)"}
                    fontSize="9"
                    style={{ transition: "fill 0.5s" }}
                  >
                    {m.desc}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

function ResumeStage() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "center center"] });
  const displayScore = useTransform(scrollYProgress, [0, 1], [0, 95]);
  const [currentScore, setCurrentScore] = useState(0);

  useMotionValueEvent(displayScore, "change", (latest) => {
    setCurrentScore(Math.round(latest));
  });

  return (
    <div ref={ref} className="flex flex-col items-start justify-center w-full relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8 w-full max-w-3xl"
      >
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Stage 03</span>
          <span className="h-1 w-1 rounded-full bg-amber-500/40" />
          <span className="text-[10px] font-medium text-muted-foreground">Resume Optimization</span>
        </div>

        <div className="space-y-4">
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {stages[2].headline}
          </h3>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            {stages[2].subheadline}
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <div className="glass rounded-[2rem] p-8 border border-border shadow-2xl relative overflow-hidden bg-card/60 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h4 className="font-bold text-foreground">ATS Match Score</h4>
                <p className="text-xs text-muted-foreground">Google SWE Role</p>
              </div>
              <div className="relative h-16 w-16 rounded-full border-4 border-amber-500/20 flex items-center justify-center bg-background">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="oklch(var(--primary) / 1)"
                    strokeWidth="4"
                    strokeDasharray="175.9"
                    initial={{ strokeDashoffset: 175.9 }}
                    style={{ strokeDashoffset: useTransform(scrollYProgress, [0, 1], [175.9, 175.9 * (1 - 0.95)]) }}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-black text-lg text-foreground">{currentScore}%</span>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {["Keywords Optimized", "Format Standardized", "Action Verbs Added"].map((item, i) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <motion.div
                    className="h-2 bg-muted rounded-full overflow-hidden flex-grow"
                  >
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: `${85 + i * 5}%` }}
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InterviewStage() {
  return (
    <div className="flex flex-col items-start justify-center w-full relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8 w-full max-w-3xl"
      >
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Stage 04</span>
          <span className="h-1 w-1 rounded-full bg-purple-500/40" />
          <span className="text-[10px] font-medium text-muted-foreground">Mock Interviews</span>
        </div>

        <div className="space-y-4">
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {stages[3].headline}
          </h3>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            {stages[3].subheadline}
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <div className="glass rounded-[2rem] p-6 border border-border shadow-2xl space-y-4 bg-card/60 backdrop-blur-md">
            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 animate-pulse">
                <Mic className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">AI Interviewer</p>
                <p className="text-xs text-muted-foreground">Listening...</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm text-foreground max-w-[85%]">
                Tell me about a time you optimized a complex system.
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-primary p-3 rounded-2xl rounded-tr-sm text-sm text-primary-foreground max-w-[85%] ml-auto"
              >
                At my last role, I identified a bottleneck in our rendering pipeline and...
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardStage() {
  return (
    <div className="flex flex-col items-start justify-center w-full relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8 w-full max-w-3xl"
      >
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Stage 05</span>
          <span className="h-1 w-1 rounded-full bg-rose-500/40" />
          <span className="text-[10px] font-medium text-muted-foreground">Career Hub</span>
        </div>

        <div className="space-y-4">
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {stages[4].headline}
          </h3>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            {stages[4].subheadline}
          </p>
        </div>

        <div className="relative w-full max-w-xl">
          <div className="glass rounded-[2rem] p-4 md:p-6 border border-border shadow-2xl bg-card/60 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Interviews", value: "12", color: "text-purple-500" },
                { label: "Resumes", value: "3", color: "text-amber-500" },
                { label: "ATS Score", value: "95%", color: "text-emerald-500" },
                { label: "Insights", value: "Active", color: "text-blue-500" },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/50 bg-background/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ScrollStory() {
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  const stageRefs = useRef([]);
  const [activeStage, setActiveStage] = useState(0);
  const [animationLock, setAnimationLock] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-stage"));
            if (!animationLock) {
              setActiveStage(index);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    stageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [animationLock]);

  useEffect(() => {
    const stickyEl = stickyRef.current;
    if (!stickyEl) return;

    const handleWheel = (e) => {
      if (animationLock) return;
      setAnimationLock(true);
      setTimeout(() => setAnimationLock(false), 800);
    };

    stickyEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => stickyEl.removeEventListener("wheel", handleWheel);
  }, [animationLock]);

  const renderActiveStage = () => {
    switch (activeStage) {
      case 0: return <GoalStage key="stage0" />;
      case 1: return <RoadmapStage key="stage1" />;
      case 2: return <ResumeStage key="stage2" />;
      case 3: return <InterviewStage key="stage3" />;
      case 4: return <DashboardStage key="stage4" />;
      default: return null;
    }
  };

  return (
    <section id="scroll-story" ref={containerRef} className="relative h-[500vh]">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            ref={(el) => (stageRefs.current[i] = el)}
            data-stage={i}
            className="h-[100vh]"
          />
        ))}
      </div>

      <div ref={stickyRef} className="sticky top-0 h-screen overflow-hidden flex items-center bg-background">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -translate-y-1/4 translate-x-1/4 pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[140px] translate-y-1/4 -translate-x-1/4 pointer-events-none z-0" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] -translate-y-1/2 -translate-x-1/2 pointer-events-none z-0" />

        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
          {stages.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveStage(i);
                window.scrollTo({
                  top: containerRef.current.offsetTop + (i * window.innerHeight),
                  behavior: "smooth"
                });
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${activeStage === i ? "bg-primary scale-125" : "bg-border hover:bg-primary/50"}`}
            />
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 animate-bounce text-muted-foreground">
          <span className="text-[10px] uppercase tracking-widest font-bold">Scroll to Explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 w-full md:pl-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={`active-stage-${activeStage}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderActiveStage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

