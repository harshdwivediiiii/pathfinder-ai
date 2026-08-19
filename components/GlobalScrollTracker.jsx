"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

const sections = [
  { id: "hero", label: "Overview" },
  { id: "roadmap", label: "Roadmap" },
  { id: "resume", label: "Resume" },
  { id: "interview", label: "Interview" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "question", label: "FAQ" },
];

export function GlobalScrollTracker() {
  const [activeSection, setActiveSection] = useState("hero");
  const [hideTracker, setHideTracker] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // 100px header offset
      const scrollStoryEl = document.getElementById("career-scroll");
      const heroEl = document.getElementById("hero");
      const featuresEl = document.getElementById("features");
      const pricingEl = document.getElementById("pricing");
      const questionEl = document.getElementById("question");

      // Check if user scrolled to the bottom of the page
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      if (isAtBottom) {
        setActiveSection("question");
        setHideTracker(false);
        return;
      }

      // Check career-scroll dimensions
      if (scrollStoryEl) {
        const offsetTop = scrollStoryEl.offsetTop;
        const offsetHeight = scrollStoryEl.offsetHeight;

        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          // Inside ScrollStory!
          setHideTracker(true);
          const stageIndex = Math.floor((scrollPosition - offsetTop) / window.innerHeight);
          if (stageIndex === 0) {
            setActiveSection("hero"); // Goal Setting (stage 0) maps to Overview/Hero
          } else if (stageIndex === 1) {
            setActiveSection("roadmap");
          } else if (stageIndex === 2) {
            setActiveSection("resume");
          } else if (stageIndex >= 3) {
            setActiveSection("interview");
          }
          return;
        }
      }

      // Outside ScrollStory
      setHideTracker(false);

      // Check other elements
      if (heroEl && scrollPosition >= heroEl.offsetTop && scrollPosition < heroEl.offsetTop + heroEl.offsetHeight) {
        setActiveSection("hero");
        return;
      }

      if (featuresEl && scrollPosition >= featuresEl.offsetTop && scrollPosition < featuresEl.offsetTop + featuresEl.offsetHeight) {
        setActiveSection("features");
        return;
      }

      // Handle the gap between features and pricing (like how-it-works or testimonials)
      if (featuresEl && pricingEl && scrollPosition >= featuresEl.offsetTop + featuresEl.offsetHeight && scrollPosition < pricingEl.offsetTop) {
        setActiveSection("features"); // Stay on features until pricing enters
        return;
      }

      if (pricingEl && scrollPosition >= pricingEl.offsetTop && scrollPosition < pricingEl.offsetTop + pricingEl.offsetHeight) {
        setActiveSection("pricing");
        return;
      }

      if (questionEl && scrollPosition >= questionEl.offsetTop) {
        setActiveSection("question");
        return;
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDotClick = (id) => {
    const careerScrollEl = document.getElementById("career-scroll");

    if (id === "roadmap" && careerScrollEl) {
      window.scrollTo({
        top: careerScrollEl.offsetTop + careerScrollEl.offsetHeight * 0.3,
        behavior: "smooth"
      });
    } else if (id === "resume" && careerScrollEl) {
      window.scrollTo({
        top: careerScrollEl.offsetTop + careerScrollEl.offsetHeight * 0.55,
        behavior: "smooth"
      });
    } else if (id === "interview" && careerScrollEl) {
      window.scrollTo({
        top: careerScrollEl.offsetTop + careerScrollEl.offsetHeight * 0.8,
        behavior: "smooth"
      });
    } else {
      const el = document.getElementById(id);
      if (el) {
        const offset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  };

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
             <button 
               onClick={() => handleDotClick(s.id)}
               className="block relative z-10 p-2 -mr-2 cursor-pointer bg-transparent border-0 outline-none"
             >
               <div
                  className={`h-3 w-3 rounded-full border-[2px] transition-all duration-500 ${
                    isActive 
                      ? "bg-primary border-primary scale-125 shadow-[0_0_15px_rgba(var(--primary),0.6)]" 
                      : "bg-background border-border group-hover:border-primary/50 group-hover:scale-110"
                  }`}
                >
                  {isPast && <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />}
                </div>
             </button>
          </div>
        );
      })}
    </motion.div>
  );
}
