"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import {
  FileText,
  ScanSearch,
  Flame,
  Mail,
  Linkedin,
  Briefcase,
  Mic,
  Video,
  Star,
  BrainCircuit,
  Coffee,
  Code2,
  LayoutList,
  DollarSign,
  Calculator,
  Send,
  Lightbulb,
  Target,
  TrendingUp,
  Compass,
  GraduationCap,
  ShieldCheck,
  HeartPulse,
  RefreshCcw,
  Plane,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  RocketIcon,
  Crown,
  Home,
  Rocket,
  ShieldAlert,
  BookOpenText
} from "lucide-react";

const TOOL_CATEGORIES = [
  {
    category: "Resume & Identity",
    tools: [
      { name: "Resume Builder", desc: "Professional templates", icon: FileText, color: "bg-amber-500/10 text-amber-500 border-amber-500/20", href: "/resume" },
      { name: "ATS Analyzer", desc: "Score resume vs JD", icon: ScanSearch, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", href: "/ats-analyzer" },
      { name: "Resume Roast", desc: "Brutal AI feedback", icon: Flame, color: "bg-red-500/10 text-red-500 border-red-500/20", href: "/resume-roast" },
      { name: "Cover Letter", desc: "Tailored for success", icon: Mail, color: "bg-rose-500/10 text-rose-500 border-rose-500/20", href: "/ai-cover-letter" },
      { name: "LinkedIn Optimizer", desc: "Profile audits", icon: ScanSearch, color: "bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20", href: "/linkedin-optimizer" },
      { name: "LinkedIn Posts", desc: "Viral content creator", icon: Linkedin, color: "bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20", href: "/linkedin-post" },
    ]
  },
  {
    category: "Interview Mastery",
    tools: [
      { name: "Mock Interview", desc: "AI-powered practice", icon: Briefcase, color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", href: "/interview" },
      { name: "Voice Coach", desc: "Audio mock interviews", icon: Mic, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", href: "/interview/voice-coach" },
      { name: "Video Coach", desc: "Visual mock interviews", icon: Video, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", href: "/interview/video-coach" },
      { name: "STAR Builder", desc: "Craft perfect stories", icon: Star, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", href: "/interview/star-builder" },
      { name: "Cheat Sheet", desc: "Quick prep guide", icon: FileText, color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20", href: "/interview/cheat-sheet" },
      { name: "Behavioral Prep", desc: "Beat personality tests", icon: BrainCircuit, color: "bg-rose-500/10 text-rose-500 border-rose-500/20", href: "/behavioral-prep" },
      { name: "Coffee Chat", desc: "Mock networking", icon: Coffee, color: "bg-amber-500/10 text-amber-500 border-amber-500/20", href: "/coffee-chat" },
      { name: "Take-Home Grader", desc: "Ace the technical test", icon: Code2, color: "bg-violet-500/10 text-violet-500 border-violet-500/20", href: "/assignment-grader" },
    ]
  },
  {
    category: "Job Search & Offers",
    tools: [
      { name: "Job Tracker", desc: "Kanban board", icon: LayoutList, color: "bg-green-500/10 text-green-500 border-green-500/20", href: "/job-tracker" },
      { name: "Salary Coach", desc: "Negotiation scripts", icon: DollarSign, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", href: "/salary-negotiation" },
      { name: "Offer Comparer", desc: "Total comp calculator", icon: Calculator, color: "bg-teal-500/10 text-teal-500 border-teal-500/20", href: "/offer-comparer" },
      { name: "Networking Emails", desc: "Cold outreach", icon: Send, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", href: "/networking" },
      { name: "Email Assistant", desc: "Recruiter replies", icon: Mail, color: "bg-violet-500/10 text-violet-500 border-violet-500/20", href: "/email-assistant" },
      { name: "Equity Decoder", desc: "Value your options", icon: Calculator, color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", href: "/equity-decoder" },
      { name: "Portfolio Ideas", desc: "Stand out projects", icon: Lightbulb, color: "bg-amber-500/10 text-amber-500 border-amber-500/20", href: "/project-ideas" },
    ]
  },
  {
    category: "Career Growth",
    tools: [
      { name: "Career Pivot", desc: "Switch paths wisely", icon: Compass, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", href: "/career-pivot" },
      { name: "Skill Gap", desc: "Find missing skills", icon: Target, color: "bg-purple-500/10 text-purple-500 border-purple-500/20", href: "/skill-gap-analyzer" },
      { name: "Promotion Planner", desc: "Plan your next level", icon: TrendingUp, color: "bg-green-500/10 text-green-500 border-green-500/20", href: "/promotion-planner" },
      { name: "Learning Path", desc: "Personalized roadmap", icon: GraduationCap, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", href: "/roadmap" },
      { name: "Burnout Check", desc: "Wellbeing analysis", icon: HeartPulse, color: "bg-red-500/10 text-red-500 border-red-500/20", href: "/burnout-check" },
      { name: "Career Break", desc: "Return-to-work plan", icon: RefreshCcw, color: "bg-orange-500/10 text-orange-500 border-orange-500/20", href: "/career-break" },
      { name: "Visa Fit", desc: "Global work options", icon: Plane, color: "bg-sky-500/10 text-sky-500 border-sky-500/20", href: "/visa-fit" },
      { name: "Culture Fit", desc: "Company matching", icon: Users, color: "bg-pink-500/10 text-pink-500 border-pink-500/20", href: "/culture-fit" },
      { name: "Offer Risk", desc: "Avoid bad moves", icon: ShieldCheck, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", href: "/offer-risk" },
      { name: "Career Library", desc: "Guides and playbooks", icon: BookOpen, color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20", href: "/career-library" },
      { name: "Founder Readiness", desc: "Startup evaluation", icon: RocketIcon, color: "bg-orange-500/10 text-orange-500 border-orange-500/20", href: "/founder-readiness" },
      { name: "Executive Presence", desc: "Command the room", icon: Crown, color: "bg-purple-500/10 text-purple-500 border-purple-500/20", href: "/executive-presence" },
      { name: "Side Hustle Ideas", desc: "Micro-SaaS & Solopreneur", icon: Rocket, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", href: "/side-hustle" },
      { name: "Remote Work Negotiator", desc: "Pitch remote transition", icon: Home, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", href: "/remote-work" },
      { name: "Manager README", desc: "User manual for you", icon: BookOpenText, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", href: "/manager-readme" },
      { name: "Imposter Syndrome", desc: "Reframing exercises", icon: ShieldAlert, color: "bg-rose-500/10 text-rose-500 border-rose-500/20", href: "/imposter-syndrome" },
    ]
  }
];

export default function GrowthToolsGrid() {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI Growth Tools
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">Everything you need to grow</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a tool and get personalized career guidance instantly.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {TOOL_CATEGORIES.map((category) => (
          <div key={category.category} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category.category}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.tools.map((tool, index) => {
                const Icon = tool.icon;

                return (
                  <motion.div
                    key={tool.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                  >
                    <Link
                      href={tool.href}
                      className="group flex h-full items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tool.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{tool.name}</div>
                        <div className="truncate text-sm text-muted-foreground">{tool.desc}</div>
                      </div>

                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
