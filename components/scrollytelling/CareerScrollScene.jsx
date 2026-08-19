"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useTransform } from "framer-motion";

const FRAME_COUNT = 90;

const STAGE_RANGES = [
  { start: 0, end: 0.24, label: "Skills Being Decoded", color: [120, 80, 200] },
  { start: 0.25, end: 0.49, label: "Your Roadmap Takes Shape", color: [60, 140, 220] },
  { start: 0.50, end: 0.74, label: "Resume Optimization", color: [200, 120, 60] },
  { start: 0.75, end: 1.0, label: "Offer Awaits", color: [60, 180, 120] },
];

function generatePlaceholderFrame(index) {
  const t = index / (FRAME_COUNT - 1);
  const stage = STAGE_RANGES.find((s) => t >= s.start && t <= s.end) || STAGE_RANGES[0];
  const [r, g, b] = stage.color;
  const hueShift = (index / FRAME_COUNT) * 40 - 20;
  const c1 = `rgb(${Math.min(255, r + hueShift)}, ${Math.min(255, g + hueShift * 0.5)}, ${Math.min(255, b + hueShift * 0.3)})`;
  const c2 = `rgb(${Math.max(0, r - 40 + hueShift)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 20)})`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#bg)"/>
    <text x="960" y="500" text-anchor="middle" font-family="system-ui" font-size="48" fill="rgba(255,255,255,0.15)" font-weight="700">${stage.label}</text>
    <text x="960" y="580" text-anchor="middle" font-family="system-ui" font-size="24" fill="rgba(255,255,255,0.08)">Frame ${index + 1} / ${FRAME_COUNT}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${typeof btoa !== "undefined" ? btoa(svg) : Buffer.from(svg).toString("base64")}`;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export function CareerScrollScene({ scrollProgress }) {
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const lastFrameRef = useRef(-1);
  const rafRef = useRef(null);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  const blurVal = useTransform(scrollProgress, [0, 0.08], [8, 0]);
  const scaleVal = useTransform(scrollProgress, [0, 0.08], [1.06, 1]);
  const [blur, setBlur] = useState(8);
  const [scale, setScale] = useState(1.06);

  useEffect(() => {
    const unsubBlur = blurVal.on("change", (v) => setBlur(v));
    const unsubScale = scaleVal.on("change", (v) => setScale(v));
    return () => { unsubBlur(); unsubScale(); };
  }, [blurVal, scaleVal]);

  useEffect(() => {
    const unsub = scrollProgress.on("change", (v) => setCurrentProgress(v));
    return () => unsub();
  }, [scrollProgress]);

  useEffect(() => {
    let cancelled = false;
    const images = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = generatePlaceholderFrame(i);
      images.push(
        new Promise((resolve) => {
          img.onload = () => {
            if (!cancelled) {
              setLoaded((prev) => {
                const next = prev + 1;
                if (next === FRAME_COUNT) setReady(true);
                return next;
              });
            }
            resolve(img);
          };
          img.onerror = () => resolve(img);
        })
      );
    }

    Promise.all(images).then((imgs) => {
      if (!cancelled) framesRef.current = imgs;
    });

    return () => { cancelled = true; };
  }, []);

  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    const frames = framesRef.current;
    if (!canvas || !frames[index]) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const img = frames[index];
    const iw = img.naturalWidth || 1920;
    const ih = img.naturalHeight || 1080;

    const scalefactor = Math.max(cw / iw, ch / ih);
    const sw = iw * scalefactor;
    const sh = ih * scalefactor;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx * dpr, sy * dpr, sw * dpr, sh * dpr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      if (lastFrameRef.current >= 0) drawFrame(lastFrameRef.current);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [drawFrame]);

  useEffect(() => {
    if (!ready) return;

    const frameIndex = clamp(Math.floor(currentProgress * (FRAME_COUNT - 1)), 0, FRAME_COUNT - 1);

    if (frameIndex !== lastFrameRef.current) {
      lastFrameRef.current = frameIndex;
      rafRef.current = requestAnimationFrame(() => drawFrame(frameIndex));
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, currentProgress, drawFrame]);

  const stageIndex = clamp(
    Math.floor(currentProgress * STAGE_RANGES.length),
    0,
    STAGE_RANGES.length - 1
  );
  const showHint = currentProgress < 0.04;

  return (
    <div className="absolute inset-0 z-0">
      {!ready && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background">
          <div className="w-64 h-2 rounded-full bg-muted overflow-hidden mb-4">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(loaded / FRAME_COUNT) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Loading experience... {Math.round((loaded / FRAME_COUNT) * 100)}%
          </p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          filter: `blur(${blur}px)`,
          transform: `scale(${scale})`,
          transition: "filter 0.1s, transform 0.1s",
          opacity: ready ? 1 : 0,
        }}
      />

      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10 flex items-center gap-2.5 opacity-60">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-black text-primary">PF</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground/80 hidden sm:inline">
          PathFinder AI
        </span>
      </div>

      {showHint && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            Scroll to explore
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/60 to-transparent animate-pulse" />
        </motion.div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {STAGE_RANGES.map((s, i) => (
          <div
            key={i}
            className={`transition-all duration-300 rounded-full ${
              i === stageIndex
                ? "w-6 h-2 bg-primary"
                : i < stageIndex
                ? "w-2 h-2 bg-primary/50"
                : "w-2 h-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
