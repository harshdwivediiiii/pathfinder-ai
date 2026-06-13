"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/motion";

const maintainers = [
  {
    login: "harshdwivediiiii",
    name: "Harsh Dwivedi",
    role: "Founder & Lead Developer",
    avatar_url: "https://avatars.githubusercontent.com/u/105593974?v=4",
    html_url: "https://github.com/harshdwivediiiii",
  },
];

export function MaintainersSection() {
  if (!maintainers?.length) return null;

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {maintainers.map((m) => (
        <StaggerItem key={m.login}>
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 120, damping: 25, mass: 0.8 }}
            className="group relative h-full"
          >
            <Link
              href={m.html_url}
              target="_blank"
              className="block h-full p-6 rounded-2xl glass border border-primary/20 hover:border-primary/40 transition-all duration-500"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/8 rounded-full blur-3xl group-hover:bg-primary/15 transition-all duration-500 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all duration-300">
                    <Image
                      src={m.avatar_url}
                      alt={m.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                    <ShieldCheck className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-foreground">{m.name}</h4>
                  <p className="text-sm text-muted-foreground">{m.role}</p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  Maintainer
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 group-hover:text-primary transition-colors">
                  <span>GitHub Profile</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </Link>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
