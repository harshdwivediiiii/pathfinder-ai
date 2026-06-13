"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import StatsCards from "./_components/StatsCards";
import GrowthToolsGrid from "./_components/GrowthToolsGrid";
import RecentDocs from "./_components/RecentDocs";
import TemplatesTab from "./_components/TemplatesTab";
import DashboardView from "./_components/dashboard-view";
import { Sparkles, LayoutDashboard, FileText, Calendar } from "lucide-react";
import Link from "next/link";

// Import actions
import { getResume } from "@/actions/resume";
import { getCoverLetters } from "@/actions/cover-letter";
import { getAssessments } from "@/actions/interview";
import { getUserOnboardingStatus } from "@/actions/user";
import { getIndustryInsights } from "@/actions/dashboard";
import { getATSAnalyses } from "@/actions/ats";
import { getJobApplications } from "@/actions/job-tracker";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "templates", label: "Templates", icon: FileText },
];

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "overview";

  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [insights, setInsights] = useState(null);
  const [atsAnalyses, setATSAnalyses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboardingAndLoad() {
      try {
        const { isOnboarded, isSignedIn } = await getUserOnboardingStatus();

        if (!isSignedIn) {
          return;
        }

        if (!isOnboarded) {
          router.push("/onboarding");
          return;
        }

        const [resumeData, coverLettersData, interviewsData, insightsData, atsData, jobsData] = await Promise.all([
          getResume(),
          getCoverLetters(),
          getAssessments(),
          getIndustryInsights(),
          getATSAnalyses(),
          getJobApplications(),
        ]);

        setResumes(resumeData ? [resumeData] : []);
        setCoverLetters(coverLettersData || []);
        setInterviews(interviewsData || []);
        setInsights(insightsData);
        setATSAnalyses(atsData.success ? atsData.data : []);
        setJobs(jobsData.success ? jobsData.data : []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user) {
      checkOnboardingAndLoad();
    } else if (isLoaded && !user) {
      router.replace("/sign-in?redirect_url=/dashboard");
      setLoading(false);
    }
  }, [user, isLoaded, router]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleTabChange = (tabId) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tabId);
    router.push(`?${params.toString()}`);
  };

  const upcomingInterviews = jobs.filter(job => {
    if (job.status !== "Interviewing" || !job.interviewDate) return false;
    const now = new Date();
    const interviewTime = new Date(job.interviewDate);
    const diffTime = interviewTime - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" />
              Your Dashboard
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {greeting}, <span className="text-gradient-primary">{user?.firstName ?? "there"}</span> 👋
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Here&apos;s a look at your professional progress and career insights.
            </p>
          </div>

          {/* Custom Tabs Navigation */}
          <div className="flex p-1.5 bg-muted/50 rounded-2xl border border-border w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? "bg-background text-foreground shadow-sm border border-border" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 rounded-3xl bg-muted/50 animate-pulse border border-border" />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 rounded-3xl bg-muted/30 animate-pulse border border-border" />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === "templates" ? (
                <TemplatesTab />
              ) : (
                <div className="space-y-12">
                  {upcomingInterviews.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 shadow-lg backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                            {upcomingInterviews.map(interview => (
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

                  <StatsCards 
                    resumes={resumes} 
                    coverLetters={coverLetters} 
                    interviews={interviews} 
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-12">
                      <GrowthToolsGrid />
                    </div>
                    
                    <div className="lg:col-span-4 space-y-12">
                      <RecentDocs 
                        resumes={resumes} 
                        coverLetters={coverLetters} 
                        interviews={interviews} 
                      />
                    </div>
                  </div>

                  <div className="pt-8">
                    <div className="flex items-center gap-2 mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">Industry Intelligence</h3>
                      <div className="h-px bg-border flex-grow" />
                    </div>
                    
                    {insights ? (
                      <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl">
                        <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] h-full p-2 md:p-6">
                          <DashboardView insights={insights} atsAnalyses={atsAnalyses} />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[2rem] border border-dashed border-border p-12 text-center space-y-4 bg-muted/10">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-base font-bold">Insights Processing</p>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            We are currently gathering personalized AI insights, salary benchmarks, and market trends for your industry. Check back soon!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
