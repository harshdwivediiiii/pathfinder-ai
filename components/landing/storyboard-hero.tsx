'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

const storyboardFrames = [
  {
    id: 1,
    title: 'Your Career Journey Starts Here',
    subtitle: 'Meet the AI that transforms professionals',
    bgColor: 'from-slate-900 to-slate-800',
    content: (
      <div className="flex items-center justify-center h-full">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-2xl blur-sm opacity-80"></div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Build a Resume',
    titleHighlight: 'That Gets Interviews',
    subtitle: 'AI-powered resume optimization designed to land interviews',
    bgColor: 'from-slate-100 to-slate-50',
    textColor: 'text-slate-900',
    subtitleColor: 'text-slate-600',
    content: (
      <div className="flex items-center justify-center h-full relative">
        <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 blur-3xl opacity-60"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 blur-3xl opacity-50"></div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'ATS Score: 92%',
    subtitle: 'Your resume passes the algorithm. Now crush the interview.',
    feature: 'AI Analyzer',
    bgColor: 'from-slate-800 to-slate-700',
    content: (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ rotateY: -20, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-64 h-80 rounded-2xl border border-green-500/50 bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl p-6 transform -rotate-6"
          style={{ perspective: '1000px' }}
        >
          <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/50 text-xs font-bold text-green-400">
            ATS Score: 92%
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-3 bg-slate-600 rounded-full w-3/4"></div>
            <div className="h-3 bg-slate-600 rounded-full w-2/3"></div>
            <div className="h-3 bg-slate-600 rounded-full w-4/5"></div>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Get Roasted',
    titleHighlight: 'By Our AI Professors',
    subtitle: 'Brutal feedback that makes you better. Every single time.',
    bgColor: 'from-slate-800 to-slate-700',
    content: (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-72 h-80 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-slate-800 shadow-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-lg">⚠️</span>
            </div>
            <span className="font-bold text-orange-400">Resume Roast</span>
          </div>
          <div className="space-y-2">
            {['Your formatting is outdated', 'Keywords missing', 'Action verbs weak'].map((item, i) => (
              <div key={i} className="text-xs text-orange-300 line-through opacity-70">{item}</div>
            ))}
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 5,
    title: 'Discover Your Path',
    subtitle: 'Find the intersection of passion, skill, and market demand',
    feature: 'Career Roadmap',
    bgColor: 'from-slate-50 to-slate-100',
    textColor: 'text-slate-900',
    content: (
      <div className="flex items-center justify-center h-full">
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewBox="0 0 300 300"
          className="w-64 h-64"
        >
          <circle cx="150" cy="150" r="100" fill="none" stroke="url(#gradient)" strokeWidth="2" opacity="0.3" />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          {/* Center node */}
          <motion.circle cx="150" cy="150" r="12" fill="#8b5cf6" animate={{ r: [12, 14, 12] }} transition={{ duration: 2, repeat: Infinity }} />
          {/* Outer nodes */}
          {[
            { angle: 0, label: 'Skill' },
            { angle: 120, label: 'Passion' },
            { angle: 240, label: 'Market' },
          ].map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = 150 + 70 * Math.cos(rad);
            const y = 150 + 70 * Math.sin(rad);
            return (
              <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}>
                <line x1="150" y1="150" x2={x} y2={y} stroke="#8b5cf6" strokeWidth="2" opacity="0.5" />
                <circle cx={x} cy={y} r="8" fill="#3b82f6" />
              </motion.g>
            );
          })}
        </motion.svg>
      </div>
    ),
  },
  {
    id: 6,
    title: 'Land the Offer',
    subtitle: 'From application to acceptance in record time',
    feature: 'Success Story',
    bgColor: 'from-slate-800 to-slate-700',
    content: (
      <div className="flex items-center justify-center h-full relative">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -top-8 -right-8 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
            Job Offer: Senior Engineer
          </div>
          <div className="w-56 h-56 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-green-400 font-bold">Offer Accepted!</p>
            </div>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 7,
    title: 'Choose Your Plan',
    subtitle: 'Start free. Scale as you grow.',
    bgColor: 'from-slate-800 to-slate-700',
    content: (
      <div className="flex items-center justify-center h-full gap-4">
        {['Free', 'Pro', 'Enterprise'].map((plan, i) => (
          <motion.div
            key={plan}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={`w-40 h-48 rounded-xl border ${
              i === 1 ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-slate-600 bg-slate-700/50'
            } p-4 flex flex-col justify-between`}
          >
            <div>
              <p className="font-bold text-white">{plan}</p>
              {i === 1 && <p className="text-xs text-purple-300 mt-1">Most Popular</p>}
            </div>
            <p className="text-2xl font-bold text-white">{i === 0 ? 'Free' : `$${29 + i * 20}`}</p>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 8,
    title: 'PathFinder AI',
    subtitle: 'Your AI career companion',
    cta: true,
    bgColor: 'from-purple-950 via-slate-900 to-slate-800',
    content: (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 mx-auto shadow-2xl flex items-center justify-center">
            <span className="text-5xl">🚀</span>
          </div>
          <h1 className="text-5xl font-bold text-white">PathFinder AI</h1>
          <p className="text-xl text-purple-200">Your AI-powered career transformation</p>
        </motion.div>
      </div>
    ),
  },
];

interface StoryboardHeroProps {
  autoPlay?: boolean;
  interval?: number;
}

export function StoryboardHero({ autoPlay = true, interval = 5000 }: StoryboardHeroProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % storyboardFrames.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, interval]);

  const frame = storyboardFrames[currentFrame];
  const isLightBg = frame.bgColor.includes('slate-50') || frame.bgColor.includes('slate-100');

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${frame.bgColor} overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          key={`bg-${currentFrame}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {frame.content}
        </motion.div>
      </div>

      {/* Content overlay */}
      <div className="relative h-screen flex flex-col justify-between p-8 md:p-16">
        {/* Header with controls */}
        <div className="flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Sparkles className={`h-5 w-5 ${isLightBg ? 'text-purple-600' : 'text-purple-400'}`} />
            <span className={`text-sm font-bold uppercase tracking-widest ${isLightBg ? 'text-slate-700' : 'text-purple-300'}`}>
              Frame {currentFrame + 1} of {storyboardFrames.length}
            </span>
          </motion.div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`${isLightBg ? 'hover:bg-slate-200' : 'hover:bg-slate-700'}`}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col gap-8 max-w-4xl">
          <motion.div
            key={`text-${currentFrame}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            {frame.title && (
              <div>
                <h1 className={`text-5xl md:text-7xl font-bold tracking-tight ${isLightBg ? 'text-slate-900' : 'text-white'}`}>
                  {frame.title}
                </h1>
                {frame.titleHighlight && (
                  <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {frame.titleHighlight}
                  </h2>
                )}
              </div>
            )}

            {frame.subtitle && (
              <p className={`text-xl md:text-2xl ${isLightBg ? frame.subtitleColor || 'text-slate-600' : 'text-slate-300'}`}>
                {frame.subtitle}
              </p>
            )}
          </motion.div>

          {/* CTA Button on last frame */}
          {frame.cta && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Button
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg px-8"
              >
                Start Building Free
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* Frame indicators and navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-6"
        >
          {/* Progress indicators */}
          <div className="flex gap-2">
            {storyboardFrames.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => {
                  setCurrentFrame(i);
                  setIsPlaying(false);
                }}
                className={`h-1 transition-all duration-300 ${i === currentFrame ? 'w-12 bg-gradient-to-r from-purple-500 to-blue-500' : `w-2 ${isLightBg ? 'bg-slate-400' : 'bg-slate-600'}`}`}
                whileHover={{ scale: 1.1 }}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="default"
              onClick={() => setCurrentFrame((prev) => (prev - 1 + storyboardFrames.length) % storyboardFrames.length)}
              disabled={currentFrame === 0}
              className={isLightBg ? '' : 'border-slate-600 text-white hover:bg-slate-700'}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => setCurrentFrame((prev) => (prev + 1) % storyboardFrames.length)}
              className={isLightBg ? '' : 'border-slate-600 text-white hover:bg-slate-700'}
            >
              Next
            </Button>
          </div>
        </motion.div>
      </div>


    </div>
  );
}
