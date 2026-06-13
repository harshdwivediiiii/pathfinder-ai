"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ScanSearch, Mic, FileText, Mail, Briefcase, ChevronRight,
  Flame, Linkedin, Star, Video, LayoutList, Lightbulb, 
  DollarSign, Calculator, Send, ArrowRightLeft, CalendarClock,
  Coffee, ShieldAlert, Code2, HeartPulse, Rocket,
  Home, Workflow, CalendarHeart, Globe, MapPin, Users, Flag, HandCoins, Target, LineChart, Brain, BookOpen
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
    category: "Transitions & Growth",
    tools: [
      { name: "Promotion Coach", desc: "Get that raise", icon: TrendingUp, color: "bg-purple-500/10 text-purple-500 border-purple-500/20", href: "/promotion-negotiator" },
      { name: "Career Pivot", desc: "Map your transition", icon: ArrowRightLeft, color: "bg-orange-500/10 text-orange-500 border-orange-500/20", href: "/career-pivot" },
      { name: "30-60-90 Plan", desc: "New job success", icon: CalendarClock, color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", href: "/onboarding-plan" },
      { name: "Freelance Proposals", desc: "Win contracts", icon: FileSignature, color: "bg-teal-500/10 text-teal-500 border-teal-500/20", href: "/freelance-proposal" },
      { name: "Resignation Letter", desc: "Quit professionally", icon: DoorOpen, color: "bg-red-500/10 text-red-500 border-red-500/20", href: "/resignation-letter" },
      { name: "Layoff Strategist", desc: "Severance & recovery", icon: ShieldAlert, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", href: "/layoff-strategist" },
      { name: "Burnout Coach", desc: "Boundary setting", icon: HeartPulse, color: "bg-rose-500/10 text-rose-500 border-rose-500/20", href: "/burnout-coach" },
      { name: "Side Hustle", desc: "Micro-SaaS ideas", icon: Rocket, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", href: "/side-hustle" },
      { name: "Remote Work", desc: "Pitch WFH or 4-day week", icon: Home, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", href: "/remote-work" },
      { name: "Internal Transfer", desc: "Move teams gracefully", icon: Workflow, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", href: "/internal-transfer" },
      { name: "Sabbatical Planner", desc: "Plan your career break", icon: CalendarHeart, color: "bg-violet-500/10 text-violet-500 border-violet-500/20", href: "/career-break" },
      { name: "Visa Guide", desc: "Immigration strategies", icon: Globe, color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", href: "/visa-guide" },
      { name: "Relocation", desc: "Compare cities & COLA", icon: MapPin, color: "bg-orange-500/10 text-orange-500 border-orange-500/20", href: "/relocation" },
      { name: "Mentor Matcher", desc: "Find your career guide", icon: Users, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", href: "/mentor-matcher" },
      { name: "Toxic Workplace", desc: "Discreet escape plans", icon: Flag, color: "bg-red-500/10 text-red-500 border-red-500/20", href: "/toxic-workplace" },
      { name: "Freelance Rate", desc: "Calculate your worth", icon: HandCoins, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", href: "/freelance-rate" },
      { name: "Ikigai Builder", desc: "Find your life purpose", icon: Target, color: "bg-violet-500/10 text-violet-500 border-violet-500/20", href: "/ikigai" },
      { name: "Performance Review", desc: "Ace your assessment", icon: LineChart, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", href: "/performance-review" },
      { name: "Imposter Coach", desc: "Rewrite the narrative", icon: Brain, color: "bg-rose-500/10 text-rose-500 border-rose-500/20", href: "/imposter-syndrome" },
      { name: "Manager README", desc: "Lead with clarity", icon: BookOpen, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", href: "/manager-readme" },
      { name: "Explore Careers", desc: "Discover & Compare", icon: Compass, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", href: "/explore" },
    ]
  }
];

export default function GrowthToolsGrid() {
  return (
    <div className="space-y-12">
      {TOOL_CATEGORIES.map((categoryGroup, idx) => (
        <div key={categoryGroup.category} className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">{categoryGroup.category}</h3>
            <div className="h-px bg-border flex-grow" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categoryGroup.tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 + (idx * 0.1) }}
                  whileHover={{ y: -4 }}
                  className="h-full"
                >
                  <Link href={tool.href} className="block h-full">
                    <div className="relative h-full p-5 rounded-3xl border border-border bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 transition-transform group-hover:scale-110 duration-300 ${tool.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground flex items-center gap-1">
                          {tool.name}
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                      </div>

                      {/* Hover background effect */}
                      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
