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
    .catch(err=>console.error(err))