"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function CursorGlow() {
  const [mounted, setMounted] = useState(false);
  const [mouse, setMouse] = useState({ x: -100, y: -100 });

  const springX = useSpring(mouse.x, { stiffness: 100, damping: 30, mass: 0.5 });
  const springY = useSpring(mouse.y, { stiffness: 100, damping: 30, mass: 0.5 });

  useEffect(() => {
    setMounted(true);
    const handleMouse = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
    >
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/8 to-primary/4 blur-[150px]"
      />
    </motion.div>
  );
}
