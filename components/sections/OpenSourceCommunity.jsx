"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Github, Sparkles, Bug, Lightbulb, BookText, FlaskConical, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { ContributorsMarquee } from "@/components/opensource/ContributorsMarquee";
import { TopContributors } from "@/components/opensource/TopContributors";
import { ContributionGuide } from "@/components/opensource/ContributionGuide";
import { OpenSourceStats } from "@/components/opensource/OpenSourceStats";
import { MaintainersSection } from "@/components/opensource/MaintainersSection";
import { CommunityCTA } from "@/components/opensource/CommunityCTA";

const contributionTypes = [
  { icon: Bug, label: "Bug Fixes", description: "Help squash bugs and improve stability." },
  { icon: Lightbulb, label: "Features", description: "Build new capabilities and enhancements." },
  { icon: BookText, label: "Documentation", description: "Improve guides, API docs, and wikis." },
  { icon: FlaskConical, label: "Testing", description: "Write tests and improve coverage." },
  { icon: Palette, label: "UI/UX", description: "Polish interfaces and user experience." },
  { icon: Zap, label: "Performance", description: "Optimize speed, memory, and efficiency." },
];

const springTransition = {
  type: "spring",
  stiffness: 120,
  damping: 25,
  mass: 0.8,
};

export function OpenSourceCommunity() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.github.com/repos/harshdwivediiiii/pathfinder-ai/contributors?per_page=100")
      .then((res) => res.json())
      .then((data) => {
        setContributors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="relative py-8 md:py-12 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-purple-500/4 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 space-y-32 md:space-y-48">
        {/* ───────────── HEADER ───────────── */}
        <FadeUp className="max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary"
          >
            <Github className="h-3 w-3" />
            Open Source
          </motion.div>

          <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Built in Public.{" "}
            <span className="text-gradient-primary">Powered by Contributors.</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            PathFinder AI is an open-source project built by developers, students, and contributors
            from around the world. Join us and help shape the future of AI-powered career growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild
              size="lg"
              className="h-14 px-10 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300 group bg-primary text-primary-foreground"
            >
              <a href="https://github.com/harshdwivediiiii/pathfinder-ai" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-5 w-5" />
                Star on GitHub
                <Sparkles className="ml-2 h-4 w-4 text-primary-foreground/60" />
              </a>
            </Button>
            <Button asChild
              size="lg"
              variant="outline"
              className="h-14 px-10 rounded-2xl text-base font-bold border-border/50 glass hover:bg-muted/50 transition-all duration-300 group"
            >
              <a href="https://github.com/harshdwivediiiii/pathfinder-ai/issues" target="_blank" rel="noopener noreferrer">
                Start Contributing
                <Sparkles className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </FadeUp>

        {/* ───────────── CONTRIBUTOR MARQUEE ───────────── */}
        <div className="space-y-8">
          <FadeUp className="text-center space-y-2">
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              Our{" "}
              <span className="text-gradient-primary">Contributors</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Amazing people who have contributed to PathFinder AI
            </p>
          </FadeUp>
          <ContributorsMarquee contributors={contributors} />
        </div>

        {/* ───────────── TOP CONTRIBUTORS ───────────── */}
        <div className="space-y-10">
          <FadeUp className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Top{" "}
              <span className="text-gradient-primary">Contributors</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Leading the charge in building PathFinder AI
            </p>
          </FadeUp>
          {!loading && <TopContributors contributors={contributors} />}
        </div>

        {/* ───────────── CONTRIBUTION TYPES ───────────── */}
        <div className="space-y-10">
          <FadeUp className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Ways to{" "}
              <span className="text-gradient-primary">Contribute</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              There&apos;s a place for every skill set
            </p>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {contributionTypes.map((type) => {
              const Icon = type.icon;
              return (
                <StaggerItem key={type.label}>
                  <motion.div
                    whileHover={{ y: -6, scale: 1.03 }}
                    transition={springTransition}
                    className="group relative p-6 rounded-2xl glass border border-border/40 hover:border-primary/30 transition-all duration-500 text-center"
                  >
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
                    <div className="relative z-10 space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">
                          {type.label}
                        </h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>

        {/* ───────────── HOW TO CONTRIBUTE ───────────── */}
        <div className="space-y-10">
          <FadeUp className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              How to{" "}
              <span className="text-gradient-primary">Contribute</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Four simple steps to become a contributor
            </p>
          </FadeUp>
          <ContributionGuide />
        </div>

        {/* ───────────── LIVE STATS ───────────── */}
        <div className="space-y-10">
          <FadeUp className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Open Source{" "}
              <span className="text-gradient-primary">Stats</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Live GitHub statistics for PathFinder AI
            </p>
          </FadeUp>
          <OpenSourceStats />
        </div>

        {/* ───────────── MAINTAINERS ───────────── */}
        <div className="space-y-10">
          <FadeUp className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              <span className="text-gradient-primary">Maintainers</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              The people behind PathFinder AI
            </p>
          </FadeUp>
          <MaintainersSection />
        </div>

        {/* ───────────── COMMUNITY CTA ───────────── */}
        <CommunityCTA />
      </div>
    </section>
  );
}
