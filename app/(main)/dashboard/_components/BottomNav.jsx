"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { House, FileText, Copy, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { name: "Home", icon: House, href: "/dashboard" },
  { name: "Docs", icon: FileText, href: "/resume" },
  { name: "Templates", icon: Copy, href: "/dashboard?tab=templates" },
  { name: "Tools", icon: Menu, href: "/ats-analyzer" },
  { name: "Profile", icon: User, href: "/onboarding" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      {TABS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px]",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", active ? "text-foreground" : "text-muted-foreground")} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
