"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Bot,
  FileText,
  Mail,
  Mic,
  Copy,
  ScanSearch,
  Briefcase,
  Map,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Sparkles,
  Lightbulb,
  DollarSign,
  Video,
  Flame,
  Star,
  Send,
  Linkedin,
  FileSearch,
  Calculator,
  ArrowRightLeft,
  CalendarClock,
  DoorOpen,
  TrendingUp,
  FileSignature,
  BrainCircuit,
  LayoutList,
  Coffee,
  ShieldAlert,
  Compass,
  Code2,
  HeartPulse,
  Rocket,
  Home,
  Workflow,
  CalendarHeart,
  Globe,
  MapPin,
  Users,
  Flag,
  HandCoins,
  Target,
  LineChart,
  Brain,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/use-scroll-lock";

const MENU_GROUPS = [
  {
    title: "Intelligence",
    items: [
      { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/ats-analyzer", label: "ATS Analyzer", icon: <ScanSearch className="h-4 w-4 text-blue-500" /> },
      { href: "/dashboard?tab=templates", label: "Templates", icon: <Copy className="h-4 w-4" /> },
    ]
  },
  {
    title: "Resumes & Branding",
    items: [
      { href: "/resume-builder", label: "Resume Builder", icon: <FileText className="h-4 w-4 text-amber-500" /> },
      { href: "/resume-roast", label: "Resume Roast", icon: <Flame className="h-4 w-4 text-red-500" /> },
      { href: "/ai-cover-letter", label: "Cover Letters", icon: <Mail className="h-4 w-4 text-rose-500" /> },
      { href: "/linkedin-optimizer", label: "LinkedIn Optimizer", icon: <ScanSearch className="h-4 w-4 text-[#0A66C2]" /> },
      { href: "/linkedin-post", label: "LinkedIn Posts", icon: <Linkedin className="h-4 w-4 text-[#0A66C2]" /> },
    ]
  },
  {
    title: "Interview Prep",
    items: [
      { href: "/interview", label: "Mock Interviews", icon: <Briefcase className="h-4 w-4 text-indigo-500" /> },
      { href: "/interview/voice-coach", label: "Voice Coach", icon: <Mic className="h-4 w-4 text-emerald-500" /> },
      { href: "/interview/video-coach", label: "Video Coach", icon: <Video className="h-4 w-4 text-blue-500" /> },
      { href: "/interview/star-builder", label: "STAR Builder", icon: <Star className="h-4 w-4 text-yellow-500" /> },
      { href: "/interview/cheat-sheet", label: "Cheat Sheet", icon: <FileSearch className="h-4 w-4 text-zinc-500" /> },
      { href: "/behavioral-prep", label: "Behavioral Prep", icon: <BrainCircuit className="h-4 w-4 text-rose-500" /> },
      { href: "/coffee-chat", label: "Coffee Chat", icon: <Coffee className="h-4 w-4 text-amber-500" /> },
      { href: "/assignment-grader", label: "Take-Home Grader", icon: <Code2 className="h-4 w-4 text-violet-500" /> },
    ]
  },
  {
    title: "Search & Offers",
    items: [
      { href: "/job-tracker", label: "Job Tracker", icon: <LayoutList className="h-4 w-4 text-green-500" /> },
      { href: "/salary-negotiation", label: "Salary Coach", icon: <DollarSign className="h-4 w-4 text-emerald-500" /> },
      { href: "/offer-comparer", label: "Offer Comparer", icon: <Calculator className="h-4 w-4 text-teal-500" /> },
      { href: "/networking", label: "Networking", icon: <Send className="h-4 w-4 text-blue-500" /> },
      { href: "/email-assistant", label: "Email Assistant", icon: <Mail className="h-4 w-4 text-violet-500" /> },
      { href: "/equity-decoder", label: "Equity Decoder", icon: <Calculator className="h-4 w-4 text-indigo-500" /> },
      { href: "/project-ideas", label: "Portfolio Ideas", icon: <Lightbulb className="h-4 w-4 text-amber-500" /> },
    ]
  },
  {
    title: "Career Growth",
    items: [
      { href: "/promotion-negotiator", label: "Promotion Coach", icon: <TrendingUp className="h-4 w-4 text-purple-500" /> },
      { href: "/career-pivot", label: "Career Pivot", icon: <ArrowRightLeft className="h-4 w-4 text-orange-500" /> },
      { href: "/onboarding-plan", label: "30-60-90 Plan", icon: <CalendarClock className="h-4 w-4 text-indigo-500" /> },
      { href: "/freelance-proposal", label: "Freelance Proposals", icon: <FileSignature className="h-4 w-4 text-teal-500" /> },
      { href: "/explore", label: "Explore Careers", icon: <Compass className="h-4 w-4 text-cyan-500" /> },
      { href: "/roadmap", label: "Career Roadmap", icon: <Map className="h-4 w-4 text-amber-500" /> },
      { href: "/resignation-letter", label: "Resignation Letter", icon: <DoorOpen className="h-4 w-4 text-red-500" /> },
      { href: "/layoff-strategist", label: "Layoff Strategist", icon: <ShieldAlert className="h-4 w-4 text-blue-500" /> },
      { href: "/burnout-coach", label: "Burnout Coach", icon: <HeartPulse className="h-4 w-4 text-rose-500" /> },
      { href: "/side-hustle", label: "Side Hustle Ideas", icon: <Rocket className="h-4 w-4 text-cyan-500" /> },
      { href: "/remote-work", label: "Remote Work Negotiator", icon: <Home className="h-4 w-4 text-emerald-500" /> },
      { href: "/internal-transfer", label: "Internal Transfer", icon: <Workflow className="h-4 w-4 text-blue-500" /> },
      { href: "/career-break", label: "Sabbatical Planner", icon: <CalendarHeart className="h-4 w-4 text-violet-500" /> },
      { href: "/visa-guide", label: "Visa & Immigration", icon: <Globe className="h-4 w-4 text-indigo-500" /> },
      { href: "/relocation", label: "Relocation Analyzer", icon: <MapPin className="h-4 w-4 text-orange-500" /> },
      { href: "/mentor-matcher", label: "Mentor Matcher", icon: <Users className="h-4 w-4 text-cyan-500" /> },
      { href: "/toxic-workplace", label: "Toxic Workplace Escape", icon: <Flag className="h-4 w-4 text-red-500" /> },
      { href: "/freelance-rate", label: "Freelance Rate Calculator", icon: <HandCoins className="h-4 w-4 text-emerald-500" /> },
      { href: "/ikigai", label: "Ikigai Builder", icon: <Target className="h-4 w-4 text-violet-500" /> },
      { href: "/performance-review", label: "Performance Review Writer", icon: <LineChart className="h-4 w-4 text-blue-500" /> },
      { href: "/imposter-syndrome", label: "Imposter Syndrome Coach", icon: <Brain className="h-4 w-4 text-rose-500" /> },
      { href: "/manager-readme", label: "Manager README Builder", icon: <BookOpen className="h-4 w-4 text-cyan-500" /> },
    ]
  },
  {
    title: "System",
    items: [
      { href: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ]
  }
];

export default function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useScrollLock(isMobile && isOpen);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border relative text-sidebar-foreground font-sans">
      {/* Brand Header */}
      <div className={cn(
        "pt-8 pb-6 px-6 flex items-center mb-4 transition-all duration-300",
        isOpen || isMobile ? "gap-3" : "justify-center"
      )}>
        <div className="relative group shrink-0">
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-purple-500 rounded-xl blur opacity-40 group-hover:opacity-100 transition duration-500" />
          <div className="relative h-9 w-9 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-2xl">
            <Diamond className="h-5 w-5 text-sidebar-primary-foreground fill-current" />
          </div>
        </div>
        
        {(isOpen || isMobile) && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col flex-1 min-w-0"
          >
            <span className="font-black text-lg tracking-tighter text-foreground leading-none">PathFinder <span className="text-primary">AI</span></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Enterprise Core</span>
          </motion.div>
        )}

        {!isMobile && (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground hidden lg:block"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-8 custom-scrollbar">
        {MENU_GROUPS.map((group, idx) => (
          <div key={idx} className="space-y-3">
            {group.title && (isOpen || isMobile) && (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]"
              >
                {group.title}
              </motion.h3>
            )}
            
            <div className="space-y-1">
              {group.items.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link 
                    key={`${link.href}-${link.label}`} 
                    href={link.href} 
                    onClick={() => isMobile && setIsOpen(false)}
                    title={!isOpen && !isMobile ? link.label : undefined}
                  >
                    <div className={cn(
                      "flex items-center rounded-2xl transition-all duration-300 relative group",
                      isOpen || isMobile ? "gap-3 px-4 py-3" : "justify-center p-3.5",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}>
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav"
                          className="absolute left-0 w-1 h-6 bg-primary rounded-full" 
                        />
                      )}
                      
                      <div className={cn(
                        "shrink-0 transition-transform duration-300 group-hover:scale-110",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {link.icon}
                      </div>
                      
                      {(isOpen || isMobile) && (
                        <span className="text-sm font-bold tracking-tight">{link.label}</span>
                      )}
                      
                      {isActive && (isOpen || isMobile) && (
                        <Sparkles className="h-3 w-3 ml-auto text-primary opacity-50" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar/50 backdrop-blur-md">
        <div className={cn(
          "flex items-center rounded-2xl transition-all duration-300 border border-transparent hover:border-sidebar-border hover:bg-muted/50 cursor-pointer overflow-hidden",
          isOpen || isMobile ? "gap-3 p-3" : "justify-center p-2"
        )}>
          <div className="relative shrink-0">
            <UserButton 
              appearance={{ 
                elements: { 
                  avatarBox: "w-9 h-9 rounded-xl ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all shadow-lg" 
                } 
              }} 
            />
          </div>
          
          {(isOpen || isMobile) && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col flex-1 min-w-0"
            >
              <span className="text-xs font-black text-foreground truncate leading-tight">{user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'User Account'}</span>
              <span className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-widest mt-0.5">{user?.publicMetadata?.plan ? `${user.publicMetadata.plan} Member` : 'Free Member'}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile && !isOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-[70] rounded-2xl h-14 w-14 shadow-2xl bg-primary text-primary-foreground border-none hover:scale-110 transition-all"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ 
          width: isMobile ? (isOpen ? "85vw" : 0) : (isOpen ? 280 : 100), 
          x: isMobile ? (isOpen ? 0 : -320) : 0 
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-[70] h-[100dvh] flex-shrink-0 overflow-visible shadow-2xl lg:shadow-none bg-sidebar transition-shadow duration-300",
          isOpen ? "shadow-2xl" : "shadow-none"
        )}
      >
        <div className="h-full w-full overflow-hidden">
          {sidebarContent}
        </div>
      </motion.div>
    </>
  );
}
