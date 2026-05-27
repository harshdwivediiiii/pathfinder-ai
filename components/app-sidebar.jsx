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
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Diamond
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MENU_GROUPS = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/resume", label: "Resumes", icon: <FileText className="h-4 w-4" /> },
      { href: "/ai-cover-letter", label: "Cover Letters", icon: <Mail className="h-4 w-4" /> },
      { href: "/interview", label: "Interviews", icon: <Mic className="h-4 w-4" /> },
      { href: "/dashboard?tab=templates", label: "Templates", icon: <Copy className="h-4 w-4" /> },
    ]
  },
  {
    title: "GROWTH TOOLS",
    items: [
      { href: "/ai-assistant", label: "AI Assistant", icon: <Bot className="h-4 w-4" /> },
      { href: "/ats-analyzer", label: "ATS Analyzer", icon: <ScanSearch className="h-4 w-4" /> },
      { href: "/interview", label: "Mock Interview", icon: <Mic className="h-4 w-4" /> },
      { href: "/ai-assistant", label: "Career Coaching", icon: <Briefcase className="h-4 w-4" /> },
    ]
  },
  {
    title: "ACCOUNT",
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
    <div className="flex flex-col h-full bg-[#0F0F12] border-r border-border/10 relative text-zinc-300 font-sans">
      {/* Logo Area */}
      <div className={`pt-6 pb-2 px-5 flex items-center ${isOpen || isMobile ? 'gap-3' : 'justify-center'} mb-2`}>
        <Menu 
          className="h-5 w-5 text-zinc-400 cursor-pointer hover:text-white transition-colors shrink-0" 
          onClick={() => !isMobile && setIsOpen(!isOpen)}
        />
        {(isOpen || isMobile) && (
          <>
            <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center shrink-0">
              <Diamond className="h-5 w-5 text-black fill-black" />
            </div>
            <span className="font-semibold text-lg text-white tracking-tight truncate">PathFinder AI</span>
          </>
        )}
        {!isOpen && !isMobile && (
           <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center shrink-0 ml-3">
             <Diamond className="h-5 w-5 text-black fill-black" />
           </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-8 scrollbar-none">
        {MENU_GROUPS.map((group, idx) => (
          <div key={idx} className="space-y-3">
            {group.title && (isOpen || isMobile) && (
              <h3 className="px-3 text-[11px] font-semibold text-amber-500/80 uppercase tracking-widest">
                {group.title}
              </h3>
            )}
            
            <div className="space-y-1">
              {group.items.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link key={link.href} href={link.href} onClick={() => isMobile && setIsOpen(false)} title={!isOpen && !isMobile ? link.label : undefined}>
                    <div className={`flex items-center ${isOpen || isMobile ? 'gap-3 px-3 py-2.5' : 'justify-center p-3'} rounded-xl transition-all duration-200 ${
                      isActive 
                        ? "bg-[#27272A]/80 text-white font-medium shadow-sm" 
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-[#27272A]/40"
                    }`}>
                      <div className={`shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {link.icon}
                      </div>
                      {(isOpen || isMobile) && <span className="text-[14px]">{link.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border/10 bg-[#0F0F12]">
        <div className={`flex items-center ${isOpen || isMobile ? 'gap-3 p-2' : 'justify-center p-2'} rounded-xl bg-zinc-900/50 hover:bg-zinc-800 transition-colors cursor-pointer border border-border/5`}>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }} />
          {(isOpen || isMobile) && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium text-zinc-200 truncate">{user?.fullName || 'User Profile'}</span>
              <span className="text-[10px] text-zinc-500 truncate">{user?.primaryEmailAddress?.emailAddress || 'Manage account'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-4 left-4 z-50 rounded-full h-12 w-12 shadow-xl bg-background border-border/50 backdrop-blur-md"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ 
          width: isMobile ? (isOpen ? 280 : 0) : (isOpen ? 260 : 100), 
          x: isMobile ? (isOpen ? 0 : -280) : 0 
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={`
          fixed lg:sticky top-0 left-0 z-[60] h-[100dvh] flex-shrink-0 overflow-visible shadow-2xl lg:shadow-none bg-[#0F0F12]
        `}
      >
        <div className="h-full w-full overflow-hidden">
          {sidebarContent}
        </div>
      </motion.div>
    </>
  );
}
