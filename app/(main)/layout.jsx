"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/app-sidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function MainLayout({ children }) {
  const router = useRouter();

  useKeyboardShortcuts({
    "alt+1": () => router.push("/dashboard"),
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="w-[260px] h-screen bg-sidebar hidden lg:block" />
        }
      >
        <AppSidebar />
      </Suspense>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 md:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}