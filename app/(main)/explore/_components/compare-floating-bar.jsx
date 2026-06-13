"use client";

import { useCareerShortlist } from "@/hooks/use-career-shortlist";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function CompareFloatingBar() {
  const { shortlist, toggleShortlist, clearShortlist } = useCareerShortlist();

  if (shortlist.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl"
      >
        <div className="glass rounded-full border border-border/50 shadow-2xl p-2 pr-3 flex items-center justify-between gap-4 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 pl-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {shortlist.length}
            </div>
            <span className="text-sm font-semibold hidden md:inline-block">Careers Selected</span>
            
            <div className="hidden sm:flex items-center gap-2 ml-4 border-l pl-4 border-border/50">
              {shortlist.map(c => (
                <div key={c.id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs">
                  <span className="max-w-[80px] truncate font-medium">{c.title}</span>
                  <button onClick={() => toggleShortlist(c)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearShortlist} className="hidden sm:flex rounded-full text-xs">
              Clear
            </Button>
            {shortlist.length < 2 ? (
              <Button size="sm" className="rounded-full shadow-lg" disabled>
                <Layers className="h-4 w-4 mr-1.5" />
                Compare
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Link href="/compare">
                <Button size="sm" className="rounded-full shadow-lg">
                  <Layers className="h-4 w-4 mr-1.5" />
                  Compare
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
