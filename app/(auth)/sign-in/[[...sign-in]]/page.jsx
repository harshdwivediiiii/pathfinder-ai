"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Target,
  Mic,
  Brain,
  Route,
  Shield,
  Zap,
} from "lucide-react";

const dashboardCards = [
  {
    icon: FileText,
    label: "Resume",
    value: "85%",
    sub: "Score",
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: Target,
    label: "ATS Score",
    value: "24",
    sub: "Matched",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Mic,
    label: "Interviews",
    value: "12",
    sub: "This Month",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Brain,
    label: "AI Resume Review",
    value: "Ready",
    sub: "",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: Route,
    label: "Career Roadmap",
    value: "Generated",
    sub: "",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Mic,
    label: "Mock Interview",
    value: "Available",
    sub: "",
    color: "from-indigo-500 to-blue-600",
  },
];

const features = [
  { icon: Shield, text: "Secure" },
  { icon: Zap, text: "Fast" },
  { icon: Brain, text: "AI Powered" },
];

export default function SignInPage() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        w: 1 + ((i * 7 + 3) % 10) / 3,
        h: 1 + ((i * 11 + 5) % 10) / 4,
        l: ((i * 17 + 13) % 100),
        t: ((i * 23 + 7) % 100),
        dur: 3 + (i % 5),
        del: (i % 7),
      })),
    []
  );

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0] }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 30, -40, 0], y: [0, -20, 30, 0] }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-600/15 blur-[100px]"
        />
        {particles.map((p, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              delay: p.del,
            }}
            className="absolute rounded-full bg-white"
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              left: `${p.l}%`,
              top: `${p.t}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-full flex-col items-center justify-center lg:flex-row">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-1/2 lg:items-start lg:px-16 xl:px-24"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PathFinder AI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-4 max-w-lg text-center text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-left lg:text-5xl"
          >
            Welcome{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Back
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 max-w-md text-center text-base text-gray-400 lg:text-left lg:text-lg"
          >
            Continue your AI-powered career journey
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mb-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            {features.map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
              >
                <f.icon className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">
                  {f.text}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="hidden w-full max-w-md lg:block"
          >
            <div className="blur-sm opacity-70 scale-95">
              <div className="grid grid-cols-3 gap-3">
                {dashboardCards.map((card, i) => (
                  <motion.div
                    key={card.label}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                  >
                    <div
                      className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}
                    >
                      <card.icon className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-400">{card.label}</p>
                    <p className="text-lg font-bold text-white">{card.value}</p>
                    {card.sub && (
                      <p className="text-[10px] text-gray-500">{card.sub}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="flex w-full items-center justify-center px-4 py-8 lg:w-1/2 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md"
          >
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-purple-600/30 via-blue-600/20 to-pink-600/30 blur-xl" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
              <div className="px-8 pt-8 pb-4 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-2 flex items-center justify-center gap-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="text-2xl font-bold text-white"
                >
                  Welcome Back
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-1 text-sm text-gray-400"
                >
                  Continue your AI-powered career journey
                </motion.p>
              </div>

              <div className="px-2 pb-4">
                <SignIn
                  fallbackRedirectUrl="/dashboard"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent border-none shadow-none",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      formButtonPrimary:
                        "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold py-2.5 shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] !important",
                      formFieldInput:
                        "rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 py-2.5",
                      formFieldLabel: "text-sm font-medium text-gray-300",
                      footerActionLink:
                        "text-purple-400 hover:text-purple-300 font-semibold",
                      dividerLine: "bg-white/10",
                      dividerText: "text-gray-500",
                      socialButtonsBlockButton:
                        "border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all hover:scale-[1.02]",
                      socialButtonsBlockButtonText:
                        "text-gray-300 font-medium",
                      identityPreviewText: "text-white",
                      identityPreviewEditButton: "text-purple-400",
                      formFieldAction__forgotPassword:
                        "text-purple-400 hover:text-purple-300",
                      footer: "hidden",
                      formFieldInputShowPasswordButton:
                        "text-gray-400 hover:text-white",
                    },
                  }}
                />
              </div>

              <div className="border-t border-white/5 px-6 py-4">
                <p className="text-center text-sm text-gray-400">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="font-semibold text-purple-400 hover:text-purple-300 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              <div className="border-t border-white/5 px-6 py-3">
                <p className="text-center text-[11px] leading-relaxed text-gray-500">
                  By continuing, you agree to our{" "}
                  <a
                    href="#"
                    className="text-purple-400 hover:text-purple-300 hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-purple-400 hover:text-purple-300 hover:underline"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-6 block lg:hidden">
              <div className="grid grid-cols-2 gap-3">
                {dashboardCards.slice(0, 4).map((card, i) => (
                  <motion.div
                    key={card.label}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${card.color}`}
                      >
                        <card.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="text-[10px] font-medium text-gray-400">
                        {card.label}
                      </p>
                    </div>
                    <p className="text-base font-bold text-white">
                      {card.value}
                    </p>
                    {card.sub && (
                      <p className="text-[9px] text-gray-500">{card.sub}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
