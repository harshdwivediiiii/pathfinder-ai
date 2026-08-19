'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export const Resume3DHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // Mouse tracking for 3D tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

      setMousePosition({ x, y });
      setRotateY(x * 15);
      setRotateX(-y * 15);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    initial: { opacity: 0, x: 100, rotateZ: 0 },
    animate: {
      opacity: 1,
      x: 0,
      rotateZ: -8,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.4,
      },
    },
  };

  const floatVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="relative w-full h-[500px] lg:h-[600px] mt-8 lg:mt-0 flex items-center justify-center perspective-1200"
    >
      {/* Gradient orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-600/30 via-transparent to-blue-600/20 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-gradient-to-br from-cyan-500/15 via-transparent to-transparent rounded-full blur-[70px]" />
      </div>

      {/* 3D Resume Card */}
      <motion.div
        variants={cardVariants}
        animate="animate"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
        className="preserve-3d"
      >
        <motion.div
          animate={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 30 }}
          className="relative w-80 sm:w-96 backface-hidden preserve-3d"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="relative"
          >
            {/* Glow effect behind card */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-purple-600/40 via-blue-600/20 to-transparent blur-2xl -z-10 opacity-80" />

            {/* Main Card */}
            <div
              className="relative w-full bg-background/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden group"
              style={{
                boxShadow:
                  '0 0 40px rgba(147, 51, 234, 0.2), 0 0 80px rgba(59, 130, 246, 0.1)',
              }}
            >
              {/* Animated gradient border on hover */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />

              {/* ATS Score Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -top-3 -right-3 z-20"
              >
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-green-500/30 px-4 py-2 rounded-full text-sm font-bold"
                >
                  ATS Score: 92%
                </Badge>
              </motion.div>

              {/* Card Content */}
              <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      PF
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        Alex Johnson
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Senior Product Designer
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Core Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Next.js', 'AI/ML', 'Kubernetes'].map((skill) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.9,
                          duration: 0.4,
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30 shadow-sm"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Professional Summary
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Innovative designer with 8+ years crafting digital experiences that merge aesthetics with functionality.
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/30">
                  {[
                    { label: 'Match', value: '94%', color: 'text-emerald-500' },
                    { label: 'Keywords', value: '28/30', color: 'text-blue-500' },
                    { label: 'Format', value: 'A+', color: 'text-purple-500' },
                  ].map((metric) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0, duration: 0.4 }}
                      className="text-center"
                    >
                      <p className={`text-lg font-bold ${metric.color}`}>
                        {metric.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metric.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
