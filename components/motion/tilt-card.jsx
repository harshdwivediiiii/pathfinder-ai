"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

export function TiltCard({ children, className, tiltDegree = 10, glare = true, ...props }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;

    // Avoid NaN when element is hidden / zero size.
    if (rect.width <= 0 || rect.height <= 0) return;

    const nx = dx / rect.width; // 0..1
    const ny = dy / rect.height; // 0..1

    // -1..1
    const x = (nx - 0.5) * 2;
    const y = (ny - 0.5) * 2;

    setTilt({ x: y * -tiltDegree, y: x * tiltDegree });
    setGlarePos({ x: nx * 100, y: ny * 100 });
  };


  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 150, damping: 20, mass: 0.8 }}
      style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
      className={`relative ${className}`}
      {...props}
    >
      {children}
      {glare && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, oklch(from var(--foreground) 0 0 0 / 0.06) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}
