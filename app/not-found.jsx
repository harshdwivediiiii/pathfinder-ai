"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">

      <div className="text-center max-w-md space-y-8">

        {/* 🔥 HUGE BRANDING */}
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground">
            PathFinder AI
          </h1>

          <h2 className="text-7xl font-black text-foreground opacity-10 leading-none">
            404
          </h2>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground">
            Page not found
          </h3>
          <p className="text-muted-foreground">
            The page you’re looking for doesn’t exist or has been moved.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="h-12 px-6">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="h-12 px-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

      </div>
    </div>
  );
}