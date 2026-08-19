"use client";

import { useRef, useEffect, useState } from "react";
import { useMotionValue } from "framer-motion";
import { CareerScrollScene } from "./CareerScrollScene";
import { CareerTextOverlays } from "./CareerTextOverlays";

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export function CareerScrollWrapper() {
  const wrapperRef = useRef(null);
  const scrollMV = useMotionValue(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const wrapperH = el.offsetHeight;
      const innerH = window.innerHeight;
      const p = clamp(-rect.top / (wrapperH - innerH), 0, 1);
      scrollMV.set(p);
      setProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollMV]);

  return (
    <section
      ref={wrapperRef}
      id="career-scroll"
      className="relative h-[550vh]"
      style={{ overflowX: "clip" }}
    >
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={{ willChange: "transform" }}
      >
        <CareerScrollScene scrollProgress={scrollMV} />
        <CareerTextOverlays scrollProgress={scrollMV} />

        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent z-20"
          style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }}
        />
      </div>
    </section>
  );
}
