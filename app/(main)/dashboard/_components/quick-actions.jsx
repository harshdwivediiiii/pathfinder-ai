"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  ScanSearch,
  Mic,
  Mail,
  Linkedin,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/misc/utils";

const actions = [
  {
    label: "Resume Builder",
    desc: "Craft a professional resume",
    icon: FileText,
    href: "/resume",
    gradient: "from-amber-500/20 to-orange-500/5",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    label: "Resume Review",
    desc: "Get AI-powered ATS feedback",
    icon: ScanSearch,
    href: "/ats-analyzer",
    gradient: "from-blue-500/20 to-cyan-500/5",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    label: "Interview Prep",
    desc: "Practice with AI mock interviews",
    icon: Mic,
    href: "/interview",
    gradient: "from-purple-500/20 to-pink-500/5",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    label: "Cover Letter",
    desc: "Generate tailored applications",
    icon: Mail,
    href: "/ai-cover-letter",
    gradient: "from-rose-500/20 to-red-500/5",
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  {
    label: "LinkedIn Optimizer",
    desc: "Audit & enhance your profile",
    icon: Linkedin,
    href: "/linkedin-optimizer",
    gradient: "from-sky-500/20 to-blue-500/5",
    color: "text-[#0A66C2] bg-[#0A66C2]/10 border-[#0A66C2]/20",
  },
];

export function QuickActions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary via-amber-500 to-orange-500" />
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Your career toolkit at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={action.href}
                className="group block h-full"
              >
                <div className="relative h-full p-5 md:p-6 rounded-2xl border border-border/50 bg-card shadow-soft hover:shadow-card-hover hover:border-primary/40 transition-all duration-500 overflow-hidden">
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", action.gradient)} />
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-foreground/[0.02] rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />

                  <div className="relative z-10 space-y-4">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
                      action.color
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-foreground flex items-center gap-1">
                        {action.label}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{action.desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
