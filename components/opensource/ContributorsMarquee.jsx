"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useAnimationControls } from "framer-motion";

function ContributorCard({ login, avatar_url, contributions }) {
  return (
    <Link
      href={`https://github.com/${login}`}
      target="_blank"
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl glass border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 shrink-0"
    >
      <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-border/50">
        <Image
          src={avatar_url}
          alt={login}
          fill
          className="object-cover"
          sizes="36px"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground whitespace-nowrap leading-tight">
          {login}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          {contributions} contribution{contributions !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}

export function ContributorsMarquee({ contributors }) {
  const controls = useAnimationControls();
  const [isPaused, setIsPaused] = useState(false);

  const startAnimation = useCallback(() => {
    controls.start({
      x: ["0%", "-50%"],
      transition: {
        duration: 50,
        repeat: Infinity,
        ease: "linear",
        repeatType: "loop",
      },
    });
  }, [controls]);

  useEffect(() => {
    if (!isPaused) {
      startAnimation();
    }
  }, [isPaused, startAnimation]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    controls.stop();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (!contributors?.length) return null;

  const doubled = [...contributors, ...contributors];

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-4 w-max"
        animate={controls}
        style={{ x: "0%" }}
      >
        {doubled.map((c, i) => (
          <ContributorCard
            key={`${c.login}-${i}`}
            login={c.login}
            avatar_url={c.avatar_url}
            contributions={c.contributions}
          />
        ))}
      </motion.div>
    </div>
  );
}
