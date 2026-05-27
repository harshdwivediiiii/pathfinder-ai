"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useAuth } from "@clerk/nextjs";

const HeroSection = () => {
  const imageRef = useRef(null);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 0.3]);

  useEffect(() => {
    const imageElement = imageRef.current;
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;
      if (imageElement) {
        if (scrollPosition > scrollThreshold) {
          imageElement.classList.add("scrolled");
        } else {
          imageElement.classList.remove("scrolled");
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDashboardClick = () => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <section id = "home" className="w-full pt-36 md:pt-48 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-6 text-center"
      >
        <div className="space-y-6 mx-auto">
  {/* New: Premium Badge */}
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.5 }}
    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm"
  >
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
    </span>
    <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
      ✨ AI-Powered Career Companion
    </span>
  </motion.div>

          <motion.h1
            className="text-5xl font-bold md:text-6xl lg:text-7xl xl:text-8xl gradient-title animate-gradient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <TypeAnimation
              sequence={[
                "Your AI Career Coach for",
                1000,
                "Professional Growth",
                1000,
                "Professional Success",
                1000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
              className="block"
            />
          </motion.h1>
          <motion.p
            className="mx-auto max-w-[600px] text-muted-foreground md:text-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Advance your career with personalized guidance, interview prep, and
            AI-powered tools for job success.
          </motion.p>
        </div>

        <motion.div
  className="flex flex-col sm:flex-row justify-center items-center gap-4"
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.8, duration: 0.5 }}
>
  {/* Primary CTA - Gradient Button */}
  <Button
    size="lg"
    onClick={handleDashboardClick}
    className="relative px-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 font-semibold"
  >
    Get Started
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  </Button>

  {/* Secondary CTA - Outline Button */}
  <Button
    size="lg"
    variant="outline"
    onClick={() => {
      const featuresSection = document.getElementById("features");
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }}
    className="px-8 border-2 border-foreground/20 hover:border-foreground/40 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 hover:scale-105 font-semibold"
  >
    Learn More
  </Button>
</motion.div>

        <motion.div
          className="hero-image-wrapper mt-5 md:mt-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <motion.div
            ref={imageRef}
            className="relative mx-auto w-full max-w-[1280px] rounded-lg shadow-2xl border perspective-1000"
            initial={{ rotateX: 0, rotateY: 0, opacity: 0, scale: 0.95 }}
            animate={{ rotateX: 0, rotateY: 0, opacity: 1, scale: 1 }}
            whileHover={{ rotateX: -6, rotateY: 6 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1.1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMousePosition({
                x: (e.clientX - rect.left) / rect.width - 0.5,
                y: (e.clientY - rect.top) / rect.height - 0.5,
              });
            }}
          >
            {/* Video */}
            <motion.video
              src="/pathfinder-ai.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="rounded-lg w-full h-auto block"
              poster="/fallback-image.jpg"
            />

            {/* Overlay gradient that fades in as you scroll down */}
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none bg-gradient-to-t from-primary/10 to-transparent mix-blend-overlay"
              style={{
                opacity: overlayOpacity,
              }}
            />

            {/* Reflection on hover */}
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none bg-gradient-to-b from-white/10 to-transparent"
              animate={{ opacity: isHovered ? 0.2 : 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* Cursor-following radial glow */}
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              animate={{
                background: isHovered
                  ? `radial-gradient(circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, rgba(124,58,237,0.35) 0%, rgba(0,0,0,0) 70%)`
                  : "none",
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
            />

            {/* Slow pulsing ambient glow */}
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none bg-primary/5"
              animate={{
                boxShadow: [
                  "0 0 0 rgba(124, 58, 237, 0)",
                  "0 0 20px rgba(124, 58, 237, 0.3)",
                  "0 0 0 rgba(124, 58, 237, 0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;