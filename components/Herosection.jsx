"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Sparkles, Play } from "lucide-react";

const HeroSection = () => {
  const imageRef = useRef(null);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const translateY = useSpring(y, springConfig);

  const handleDashboardClick = () => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <section id="home" className="relative w-full pt-24 sm:pt-28 md:pt-40 lg:pt-48 pb-16 md:pb-20 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        style={{ y: translateY, opacity, scale }}
        className="container mx-auto px-4 md:px-6 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/20 dark:border-white/10"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Revolutionizing Careers with AI
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-foreground">
              Your Professional Future, <br />
              <span className="text-gradient-primary">Reimagined with AI.</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Unlock your true potential with PathFinder AI. Get personalized career coaching, 
              precision-engineered resumes, and expert-level interview preparation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button
              size="lg"
              onClick={handleDashboardClick}
              className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 font-bold group"
            >
              Launch Your Career
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const featuresSection = document.getElementById("features");
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="h-14 px-8 rounded-2xl glass hover:bg-muted/50 transition-all duration-300 font-bold group"
            >
              Explore Features
            </Button>
          </motion.div>
        </div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 sm:mt-16 md:mt-20 relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          
          <motion.div
            ref={imageRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMousePosition({
                x: (e.clientX - rect.left) / rect.width - 0.5,
                y: (e.clientY - rect.top) / rect.height - 0.5,
              });
            }}
            style={{
              rotateX: isHovered ? mousePosition.y * -10 : 0,
              rotateY: isHovered ? mousePosition.x * 10 : 0,
              transformStyle: "preserve-3d",
            }}
className="relative mx-auto max-w-5xl rounded-2xl glass border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-200 overflow-visible"          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent z-10 pointer-events-none" />
            
            <video
              src="/pathfinder-ai.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
            />

            {/* Premium Video Overlay Controls UI (Fake) */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 font-bold uppercase tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Live Career Intelligence
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                  <Play className="h-3 w-3 fill-current" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating UI Elements (Fake) */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -left-10 hidden lg:block p-6 glass rounded-2xl shadow-xl z-20 border border-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Growth</p>
                <p className="text-xl font-bold">+124% Reach</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-10 -right-10 hidden lg:block p-6 glass rounded-2xl shadow-xl z-20 border border-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                <p className="text-xl font-bold">Onboarding Ready</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
