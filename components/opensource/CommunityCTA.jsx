"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Github, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/motion";

export function CommunityCTA() {
  return (
    <FadeUp>
      <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-10 md:p-20 text-center shadow-2xl shadow-primary/5">
        <div className="absolute inset-0 grid-background opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary"
          >
            <Github className="h-3 w-3" />
            Open Source
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Become a{" "}
            <span className="text-gradient-primary">PathFinder AI</span>
            {" "}Contributor
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Whether you&apos;re fixing bugs, improving documentation, designing interfaces, or building new features, your contributions are welcome.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild
              size="lg"
              className="h-14 px-10 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300 group bg-primary text-primary-foreground"
            >
              <a href="https://github.com/harshdwivediiiii/pathfinder-ai" target="_blank" rel="noopener noreferrer">
                View Repository
                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button asChild
              size="lg"
              variant="outline"
              className="h-14 px-10 rounded-2xl text-base font-bold border-border/50 glass hover:bg-muted/50 transition-all duration-300 group"
            >
              <a href="https://github.com/harshdwivediiiii/pathfinder-ai/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22" target="_blank" rel="noopener noreferrer">
                Good First Issues
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button asChild
              size="lg"
              variant="outline"
              className="h-14 px-10 rounded-2xl text-base font-bold border-border/50 glass hover:bg-muted/50 transition-all duration-300 group"
            >
              <a href="https://github.com/harshdwivediiiii/pathfinder-ai/discussions" target="_blank" rel="noopener noreferrer">
                Join Community
                <MessageCircle className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}
