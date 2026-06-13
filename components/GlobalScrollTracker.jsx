"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

const sections = [
  { id: "hero", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "career-roadmap", label: "Roadmap" },
  { id: "resume-showcase", label: "Resume" },
  { id: "interview-coach", label: "Interview" },
  { id: "skill-gap", label: "Skill Gap" },
  { id: "pricing", label: "Pricing" },
];

export function GlobalScrollTracker() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [hideTracker, setHideTracker] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.id === "scroll-story") {
              setHideTracker(true);
            } else {
              setHideTracker(false);
              setActiveSection(entry.target.id);
            }
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );

    // Observe tracking sections
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Observe ScrollStory to hide the tracker
    const scrollStoryEl = document.getElementById("scroll-story");
    if (scrollStoryEl) observer.observe(scrollStoryEl);

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: hideTracker ? 0 : 1, x: hideTracker ? 20 : 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 h-[50vh] flex flex-col justify-between items-end hidden lg:flex ${hideTracker ? "pointer-events-none" : ""}`}
    >
      <div className="absolute right-[5px] top-[10px] bottom-[10px] w-[2px] bg-border/40 rounded-full" />
      <motion.div 
        className="absolute right-[5px] top-[10px] bottom-[10px] w-[2px] bg-primary rounded-full origin-top shadow-[0_0_10px_rgba(var(--primary),0.8)]"
        style={{ scaleY }}
      />
      
      {sections.map((s, i) => {
        const isActive = activeSection === s.id;
        const activeIndex = sections.findIndex(sec => sec.id === activeSection);
        const isPast = activeIndex > i;

        return (
          <div key={s.id} className="relative flex items-center justify-end w-full group py-2">
             <div className={`absolute right-8 flex items-center pr-2 transition-all duration-500 origin-right ${isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"}`}>
               <span className={`text-[10px] font-bold uppercase tracking-widest bg-background/80 px-2.5 py-1 rounded-md backdrop-blur-md border shadow-lg ${isActive ? "text-primary border-primary/20" : "text-muted-foreground border-border"}`}>
                 {s.label}
               </span>
             </div>
             <a href={`#${s.id}`} className="block relative z-10 p-2 -mr-2 cursor-pointer">
               <div
                  className={`h-3 w-3 rounded-full border-[2px] transition-all duration-500 ${
                    isActive 
                      ? "bg-primary border-primary scale-125 shadow-[0_0_15px_rgba(var(--primary),0.6)]" 
                      : "bg-background border-border group-hover:border-primary/50 group-hover:scale-110"
                  }`}
                >
                  {isPast && <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />}
                </div>
             </a>
          </div>
        );
      })}
    </motion.div>
  );
}
