import React, { Suspense } from "react";
import AppSidebar from "@/components/app-sidebar";

const MainLayout = async ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<div className="w-[260px] h-screen bg-[#0F0F12] hidden lg:block" />}>
        <AppSidebar />
      </Suspense>
      <main className="flex-1 w-full overflow-hidden p-4 md:p-6 pb-24 md:pb-6 relative mt-16 md:mt-0">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
