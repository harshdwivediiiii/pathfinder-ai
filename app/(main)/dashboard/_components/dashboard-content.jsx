"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeHero } from "./welcome-hero";
import { IndustryIntelligence } from "./industry-intelligence";
import { AnalyticsSnapshot } from "./analytics-snapshot";
import { SalaryAnalytics } from "./salary-analytics";
import { IndustryTrends } from "./industry-trends";
import { SkillGap } from "./skill-gap";
import { AiRecommendations } from "./ai-recommendations";
import { QuickActions } from "./quick-actions";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import Link from "next/link";

const sectionDefs = [
  { id: "overview", label: "Overview" },
  { id: "intelligence", label: "Intelligence" },
  { id: "snapshot", label: "Analytics" },
  { id: "salary", label: "Salary" },
  { id: "trends", label: "Trends" },
  { id: "skillgap", label: "Skills" },
  { id: "recommendations", label: "Recommendations" },
  { id: "actions", label: "Actions" },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

function computeScores(insight) {
  const marketScore = insight?.marketOutlook === "Positive" ? 85 : insight?.marketOutlook === "Neutral" ? 60 : 35;
  const demandScore = insight?.demandLevel === "High" ? 90 : insight?.demandLevel === "Medium" ? 60 : 30;
  const growthRaw = insight?.growthRate ?? 0;
  const growthScore = Math.min(Math.round((growthRaw / 25) * 100), 100);
  const salaryCount = insight?.salaryRanges?.length ?? 0;
  const salaryScore = salaryCount >= 5 ? 85 : salaryCount >= 3 ? 65 : 40;
  const careerScore = Math.round((marketScore + demandScore + growthScore + salaryScore) / 4);

  return { careerScore, marketScore, demandScore, growthScore, salaryScore };
}

function NavIndicator({ sections }) {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="sticky top-20 z-40 -mx-4 px-4 py-3 mb-2 overflow-x-auto scrollbar-hide" style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)" }}>
      <div className="flex items-center gap-1.5 w-fit mx-auto">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className={cn(
              "relative px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
              activeSection === id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function DashboardContent({
  userName,
  userEmail,
  currentRole,
  targetRole,
  careerGoals,
  experience,
  skills,
  insight,
  upcomingInterviews = [],
}) {
  const scores = useMemo(() => computeScores(insight), [insight]);

  const topRole = useMemo(() => {
    if (!insight?.salaryRanges?.length) return null;
    return insight.salaryRanges.reduce((a, b) => (a.median > b.median ? a : b));
  }, [insight]);

  const medianSalary = useMemo(() => {
    if (!insight?.salaryRanges?.length) return null;
    const mids = insight.salaryRanges.map((r) => r.median).sort((a, b) => a - b);
    return mids[Math.floor(mids.length / 2)];
  }, [insight]);

  const demandTrend = insight?.demandLevel === "High" ? "Growing" : insight?.demandLevel === "Medium" ? "Stable" : "Cooling";

  const sections = [
    { id: "overview", Component: WelcomeHero, props: { userName, currentRole, targetRole, insight, ...scores } },
    { id: "intelligence", Component: IndustryIntelligence, props: { insight } },
    { id: "snapshot", Component: AnalyticsSnapshot, props: { insight, topRole, medianSalary, demandTrend } },
    { id: "salary", Component: SalaryAnalytics, props: { insight } },
    { id: "trends", Component: IndustryTrends, props: { insight } },
    { id: "skillgap", Component: SkillGap, props: { insight, userSkills: skills } },
    { id: "recommendations", Component: AiRecommendations, props: { insight, currentRole, targetRole } },
    { id: "actions", Component: QuickActions, props: {} },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24 md:pb-12">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[150px] -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[120px] -z-10 -translate-x-1/4 translate-y-1/4 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-br from-primary/[0.02] via-transparent to-purple-500/[0.02] rounded-full blur-[200px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8">
        <NavIndicator sections={sectionDefs} />

        {upcomingInterviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 shadow-lg backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-base">
                  Upcoming Interview{upcomingInterviews.length > 1 ? "s" : ""} Scheduled!
                </h4>
                <p className="text-muted-foreground text-sm font-medium mt-0.5">
                  You have {upcomingInterviews.length} interview{upcomingInterviews.length > 1 ? "s" : ""} coming up in the next 3 days:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-foreground/90 font-semibold">
                  {upcomingInterviews.map((interview) => (
                    <li key={interview.id}>
                      {interview.jobTitle} at {interview.companyName} on{" "}
                      {new Date(interview.interviewDate).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Link
              href="/job-tracker"
              className="py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm transition-all shadow-sm shrink-0 text-center"
            >
              View Job Tracker
            </Link>
          </motion.div>
        )}

        <div className="space-y-14 md:space-y-24">
          {sections.map(({ id, Component, props }, i) => (
            <motion.section
              key={id}
              id={id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={sectionVariants}
            >
              <Component {...props} />
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}
