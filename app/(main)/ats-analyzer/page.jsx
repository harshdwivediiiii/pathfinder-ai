import { getATSAnalyses } from "@/actions/ats";
import { getResume } from "@/actions/resume";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import ATSAnalyzerPage from "./_components/ats-analyzer-page";

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
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-5xl md:text-6xl font-bold gradient-title mb-2">
          ATS Analyzer
        </h1>
        <p className="text-muted-foreground text-lg">
          Check how well your resume matches a job description and get AI-powered
          suggestions to boost your score.
        </p>
      </div>
      <ATSAnalyzerPage
        initialHistory={Array.isArray(historyResult?.data) ? historyResult.data : []}
        savedResumeContent={savedResume?.content || ""}
      />
    </div>
  );
}
