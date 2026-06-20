"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/app-sidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Keyboard Shortcuts for Dashboard Navigation
  useKeyboardShortcuts({
    "alt+1": () => router.push("/dashboard"),
    "alt+2": () => router.push("/resume"),
    "alt+3": () => router.push("/cover-letter"),
    "alt+4": () => router.push("/interview"),
    "alt+5": () => router.push("/insights"),
    "alt+6": () => router.push("/onboarding"),
    "alt+h": () => router.push("/chat"),
  });

  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<div className="w-[260px] h-screen bg-sidebar hidden lg:block" />}>
        <AppSidebar />
      </Suspense>
      <main className="flex-1 w-full overflow-hidden p-4 md:p-6 pb-24 md:pb-6 relative">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
