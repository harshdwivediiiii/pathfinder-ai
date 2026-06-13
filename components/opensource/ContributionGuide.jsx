"use client";

import { motion } from "framer-motion";
import { GitFork, GitPullRequest, GitMerge, Search } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";

const steps = [
  {
    icon: GitFork,
    title: "Fork Repository",
    description: "Fork the PathFinder AI repository to your GitHub account and clone it locally.",
  },
  {
    icon: Search,
    title: "Pick an Issue",
    description: "Browse open issues and find one that matches your skills and interests.",
  },
  {
    icon: GitPullRequest,
    title: "Submit Pull Request",
    description: "Make your changes and submit a pull request for review.",
  },
  {
    icon: GitMerge,
    title: "Get Merged",
    description: "After review and approval, your contribution becomes part of PathFinder AI.",
  },
];

export function ContributionGuide() {
  return (
    <div className="relative max-w-5xl mx-auto">
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-border/40 via-border to-border/40 -translate-y-1/2">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary"
            initial={{ scaleX: 0, transformOrigin: "left" }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <StaggerItem key={step.title}>
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl bg-background border border-border/50 flex items-center justify-center shadow-lg shadow-primary/5 group-hover:shadow-primary/10 transition-all duration-500">
                    <Icon className="h-9 w-9 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-lg border-2 border-background">
                    {i + 1}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-bold tracking-tight text-foreground">
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
