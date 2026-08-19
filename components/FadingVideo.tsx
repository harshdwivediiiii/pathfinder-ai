"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface FadingVideoProps {
  className?: string;
}

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4";

export function FadingVideo({ className = "" }: FadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const handleCanPlay = () => setVideoLoaded(true);
    el.addEventListener("canplaythrough", handleCanPlay);

    el.playbackRate = 0.85;

    return () => {
      el.removeEventListener("canplaythrough", handleCanPlay);
    };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Cinematic video layer */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: videoLoaded ? 1 : 0 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{ filter: "brightness(0.55) saturate(1.2)" }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      </motion.div>

      {/* Fallback animated gradient (visible while video loads) */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: videoLoaded ? 0 : 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-black to-blue-950/40" />

        <motion.div
          className="absolute top-1/4 left-1/4 w-[700px] h-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, -40, 25, 0],
            y: [0, 25, -40, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 video-overlay pointer-events-none" />

      {/* Animated purple-blue glow at top */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.12) 0%, transparent 60%)",
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom fade to pure black */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[50%] pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #000 0%, rgba(0,0,0,0.8) 30%, transparent 100%)",
        }}
      />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="noise-overlay" />
      </div>
    </div>
  );
}
