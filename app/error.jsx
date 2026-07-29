"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-destructive/10 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="mx-auto w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive shadow-2xl">
          <AlertTriangle className="h-10 w-10" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Critical Error</h1>
          <p className="text-muted-foreground leading-relaxed font-medium">
            {error?.message || "Our neural engine encountered an unexpected interruption while processing your request."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
          <Button 
            onClick={() => reset()} 
            className="w-full sm:w-auto h-12 rounded-2xl px-8 font-bold gap-2 shadow-lg shadow-primary/20"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry System
          </Button>
          <Button 
            variant="outline" 
            asChild
            className="w-full sm:w-auto h-12 rounded-2xl px-8 font-bold gap-2 border-border bg-background/50 hover:bg-muted"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Ref ID: {typeof crypto !== "undefined" ? crypto.randomUUID() : "N/A"}
        </p>
      </motion.div>
    </div>
  );
}
