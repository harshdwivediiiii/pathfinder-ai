"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, GitFork, Users, GitPullRequest, AlertCircle } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/motion";

function AnimatedCounter({ target, suffix = "", duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let startTime = null;
    let raf;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

const statIcons = {
  stars: Star,
  forks: GitFork,
  contributors: Users,
  openIssues: AlertCircle,
  pullRequests: GitPullRequest,
};

const defaultStats = {
  stars: 0,
  forks: 0,
  contributors: 0,
  openIssues: 0,
  pullRequests: 0,
};

export function OpenSourceStats() {
  const [stats, setStats] = useState(defaultStats);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const repoRes = await fetch(
          "https://api.github.com/repos/harshdwivediiiii/pathfinder-ai"
        );
        const repoData = await repoRes.json();

        const contribRes = await fetch(
          "https://api.github.com/repos/harshdwivediiiii/pathfinder-ai/contributors?per_page=1&anon=true"
        );
        let contributorCount = 0;
        const linkHeader = contribRes.headers?.get?.("Link");
        if (linkHeader) {
          const match = linkHeader.match(/page=(\d+)>; rel="last"/);
          if (match) contributorCount = parseInt(match[1]);
        } else {
          const contribData = await contribRes.json();
          contributorCount = Array.isArray(contribData) ? contribData.length : 0;
        }

        setStats({
          stars: repoData.stargazers_count ?? 0,
          forks: repoData.forks_count ?? 0,
          openIssues: repoData.open_issues_count ?? 0,
          contributors: contributorCount || 0,
          pullRequests: repoData.open_issues_count ?? 0,
        });
      } catch {
        setStats({
          stars: 0,
          forks: 0,
          contributors: 0,
          openIssues: 0,
          pullRequests: 0,
        });
      } finally {
        setLoaded(true);
      }
    };

    fetchStats();
  }, []);

  const statEntries = [
    { key: "stars", label: "Stars", icon: Star, value: stats.stars },
    { key: "forks", label: "Forks", icon: GitFork, value: stats.forks },
    { key: "contributors", label: "Contributors", icon: Users, value: stats.contributors },
    { key: "openIssues", label: "Open Issues", icon: AlertCircle, value: stats.openIssues },
    { key: "pullRequests", label: "Pull Requests", icon: GitPullRequest, value: stats.pullRequests },
  ];

  return (
    <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statEntries.map((stat) => {
        const Icon = stat.icon;
        return (
          <StaggerItem key={stat.key}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 120, damping: 25, mass: 0.8 }}
              className="group relative p-6 rounded-2xl glass border border-border/40 hover:border-primary/25 transition-all duration-500 text-center"
            >
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mx-auto">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl md:text-3xl font-black text-foreground tabular-nums">
                    {loaded ? (
                      <AnimatedCounter target={stat.value} />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
