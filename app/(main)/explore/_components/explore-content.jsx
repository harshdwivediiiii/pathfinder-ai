"use client";

import { motion } from "framer-motion";
import { Compass, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CareerCard } from "./career-card";
import { CompareFloatingBar } from "./compare-floating-bar";

export function ExploreContent({ careers }) {
  const isPersonalized = careers.some((career) => career.isPersonalized);

  return (
    <div className="min-h-screen bg-background relative pb-32">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" />
              Career Discovery
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              <Compass className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              Explore <span className="text-gradient-primary">Careers</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium mt-2 max-w-2xl">
              {isPersonalized
                ? "Ranked from your onboarding skills and target role. Save careers to your shortlist and compare them."
                : "Browse example careers from our curated catalog. Complete onboarding with your skills to see personalized match scores."}
            </p>
            {!isPersonalized && (
              <Badge variant="secondary" className="mt-2 text-[11px] font-semibold tracking-wide">
                Browse examples
              </Badge>
            )}
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {careers.map((career, i) => (
            <motion.div
              key={career.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CareerCard career={career} />
            </motion.div>
          ))}
        </div>
      </div>
      <CompareFloatingBar />
    </div>
  );
}
