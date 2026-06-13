"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  FileText, 
  Mail, 
  Mic, 
  Copy, 
  ScanSearch, 
  Bot, 
  Briefcase, 
  Settings,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Resumes", icon: FileText, href: "/resume" },
  { name: "Cover Letters", icon: Mail, href: "/ai-cover-letter" },
  { name: "Interviews", icon: Mic, href: "/interview" },
  { name: "Templates", icon: Copy, href: "/dashboard?tab=templates" },
];

const GROWTH_TOOLS = [
  { name: "AI Assistant", icon: Bot, href: "/ai-assistant" },
  { name: "ATS Analyzer", icon: ScanSearch, href: "/ats-analyzer" },
  { name: "Mock Interview", icon: Mic, href: "/interview/mock" },
  { name: "Career Coaching", icon: Briefcase, href: "/ai-assistant" },
  { name: "Explore Careers", icon: Compass, href: "/explore" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const tab = searchParams.get("tab");

  const isActive = (href) => {
    if (href.includes("?tab=templates")) {
      return pathname === "/dashboard" && tab === "templates";
    }
    if (href === "/dashboard") {
      return pathname === "/dashboard" && !tab;
    }
    return pathname === href;
  };

  const NavLink = ({ item }) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-[13px] mx-1.5 my-0.5 rounded-md transition-colors",
          active 
            ? "bg-muted text-foreground font-medium" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="w-4 h-4" />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="w-52 hidden md:flex flex-col bg-background border-r border-border h-screen sticky top-0">
      <div className="p-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
          <div className="w-3 h-3 bg-background rotate-45" />
        </div>
        <span className="text-[13px] font-medium text-foreground">PathFinder AI</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="mb-4">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 pt-3 pb-1">
            GROWTH TOOLS
          </p>
          {GROWTH_TOOLS.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 pt-3 pb-1">
            ACCOUNT
          </p>
          <NavLink 
            item={{ name: "Settings", icon: Settings, href: "/settings" }} 
          />
        </div>
      </nav>

      <div className="border-t border-border p-3 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full flex items-center justify-center">
            {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || "U"}
          </div>
          <div className="flex-1 truncate">
            <p className="text-[12px] font-medium text-foreground truncate">
              {user?.fullName || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress || "Pro Plan"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
