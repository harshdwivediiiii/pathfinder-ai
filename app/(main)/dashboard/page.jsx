"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import StatsCards from "./_components/StatsCards";
import GrowthToolsGrid from "./_components/GrowthToolsGrid";
import RecentDocs from "./_components/RecentDocs";
import TemplatesTab from "./_components/TemplatesTab";
import DashboardView from "./_components/dashboard-view";

// Import actions
import { getResume } from "@/actions/resume";
import { getCoverLetters } from "@/actions/cover-letter";
import { getAssessments } from "@/actions/interview";
import { getUserOnboardingStatus } from "@/actions/user";
import { getIndustryInsights } from "@/actions/dashboard";
import { getATSAnalyses } from "@/actions/ats";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "overview";

  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [insights, setInsights] = useState(null);
  const [atsAnalyses, setATSAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboardingAndLoad() {
      try {
        const { isOnboarded } = await getUserOnboardingStatus();
        
        if (!isOnboarded) {
          router.push("/onboarding");
          return;
        }

        const [resumeData, coverLettersData, interviewsData, insightsData, atsData] = await Promise.all([
          getResume(),
          getCoverLetters(),
          getAssessments(),
          getIndustryInsights(),
          getATSAnalyses(),
        ]);

        // Wrap single resume in array if it exists
        setResumes(resumeData ? [resumeData] : []);
        setCoverLetters(coverLettersData || []);
        setInterviews(interviewsData || []);
        setInsights(insightsData);
        setATSAnalyses(atsData.success ? atsData.data : []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user) {
      checkOnboardingAndLoad();
    }
  }, [user, isLoaded, router]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const OverviewContent = () => (
    <>
      <div className="mb-7">
        <h1 className="text-lg font-medium text-foreground mb-1">
          {greeting}, {user?.firstName ?? "there"} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Your career journey at a glance
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <StatsCards 
            resumes={resumes} 
            coverLetters={coverLetters} 
            interviews={interviews} 
          />
          <GrowthToolsGrid />
          {insights && (
            <DashboardView insights={insights} atsAnalyses={atsAnalyses} />
          )}
          <RecentDocs 
            resumes={resumes} 
            coverLetters={coverLetters} 
            interviews={interviews} 
          />
        </div>
      )}
    </>
  );

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {tab === "templates" ? <TemplatesTab /> : <OverviewContent />}
      </div>
    </div>
  );
}
