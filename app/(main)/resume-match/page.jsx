import { getResumeMatchHistory } from "@/actions/resume-match";
import { getResume } from "@/actions/resume";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import MatchScorePage from "./_components/match-score-page";
import { Sparkles, Target } from "lucide-react";

export const metadata = {
  title: "Job Match Score | PathFinder AI",
  description:
    "Analyze your resume against a specific job description. Get a match score, find missing keywords, and receive tailored improvement suggestions.",
};

export default async function ResumeMatchRoute() {
  const { isOnboarded, user } = await getUserOnboardingStatus();

  // Bypass redirect for local development to allow taking screenshots
  const isDevBypass = process.env.NODE_ENV === "development";
  
  if (!user && !isDevBypass) redirect("/sign-in");
  if (!isOnboarded && !isDevBypass) redirect("/onboarding");

  // Load in parallel
  let historyResult = { data: [] };
  let savedResume = { content: "" };
  
  try {
    const results = await Promise.all([
      getResumeMatchHistory().catch(() => ({ data: [] })),
      getResume().catch(() => ({ content: "" })),
    ]);
    historyResult = results[0];
    savedResume = results[1];
  } catch (error) {
    console.warn("Failed to load initial data, likely due to local DB connection:", error);
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="h-3 w-3" />
            Job Targeting
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              <Target className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              Resume <span className="text-gradient-primary">Match Score</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium mt-2 max-w-2xl">
              Benchmark your resume against a specific job description. Get detailed feedback on skills, experience, and keywords to optimize your application.
            </p>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] p-4 md:p-8">
            <MatchScorePage
              initialHistory={Array.isArray(historyResult?.data) ? historyResult.data : []}
              savedResumeContent={savedResume?.content || ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
