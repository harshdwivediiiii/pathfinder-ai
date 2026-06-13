"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/motion";

export function CTASection() {
  return (
    <section id="contact" className="relative py-8 md:py-12 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <FadeUp>
          <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-12 md:p-24 text-center shadow-2xl shadow-primary/5">
            <div className="absolute inset-0 grid-background opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary"
              >
                <Sparkles className="h-3 w-3" />
                Get Started Today
              </motion.div>

              <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Ready to Accelerate{" "}
                <span className="text-gradient-primary">Your Career?</span>
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Join thousands of ambitious professionals using AI to land their dream jobs,
                master interviews, and accelerate their career growth.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button asChild
                  size="lg"
                  className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300 group bg-primary text-primary-foreground"
                >
                  <Link href="/dashboard">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 rounded-2xl text-lg font-bold border-border/50 glass hover:bg-muted/50 transition-all duration-300"
                >
                  <Link href="#features">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
