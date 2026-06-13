"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/motion";

export function TopContributors({ contributors }) {
  const top = contributors?.slice(0, 6);
  if (!top?.length) return null;

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {top.map((c) => (
        <StaggerItem key={c.login}>
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 120, damping: 25, mass: 0.8 }}
            className="group relative h-full"
          >
            <Link
              href={c.html_url || `https://github.com/${c.login}`}
              target="_blank"
              className="block h-full p-5 rounded-2xl glass border border-border/40 hover:border-primary/25 transition-all duration-500"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />

              <div className="relative z-10 flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden ring-2 ring-border/50 group-hover:ring-primary/30 transition-all duration-300">
                  <Image
                    src={c.avatar_url}
                    alt={c.login}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-base font-bold text-foreground truncate">
                    {c.login}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {c.contributions} contribution{c.contributions !== 1 ? "s" : ""}
                  </span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </div>
            </Link>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
