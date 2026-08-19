import { getATSAnalyses } from "@/actions/ats";
import { getResume } from "@/actions/resume";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import { Sparkles, ScanSearch } from "lucide-react";
import ATSAnalyzerPage from "./_components/ats-analyzer-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ATS Analyzer | PathFinder AI",
  description:
    "Analyze your resume against any job description. Get an ATS compatibility score, find missing keywords, and receive AI-powered improvement suggestions.",
};

export default async function ATSAnalyzerRoute() {
  const { isOnboarded, user } = await getUserOnboardingStatus();

  if (!user) redirect("/sign-in");
  if (!isOnboarded) redirect("/onboarding");

  // Load in parallel
  const [historyResult, savedResume] = await Promise.all([
    getATSAnalyses(),
    getResume(),
  ]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="h-3 w-3" />
            Precision Matching
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              <ScanSearch className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              ATS <span className="text-gradient-primary">Compatibility Hub</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium mt-2 max-w-2xl">
              Optimize your reach. Benchmark your resume against real-world job descriptions using our advanced neural scoring engine.
            </p>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] p-4 md:p-8">
            <ATSAnalyzerPage
              initialHistory={Array.isArray(historyResult?.data) ? historyResult.data : []}
              savedResumeContent={savedResume?.content || ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
