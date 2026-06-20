import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { isIndustryInsightStale } from "@/lib/industry-insights";
import { getIndustryInsights } from "@/actions/dashboard";
import { DashboardContent } from "./_components/dashboard-content";
import { EmptyState } from "./_components/empty-state";

async function getUpcomingInterviews(userId) {
  const jobs = await db.jobApplication.findMany({
    where: {
      userId,
      status: "Interview",
      interviewDate: { not: null },
    },
    select: {
      id: true,
      jobTitle: true,
      companyName: true,
      interviewDate: true,
    },
  });

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return jobs.filter((job) => {
    const interviewTime = new Date(job.interviewDate);
    return interviewTime >= now && interviewTime <= threeDaysFromNow;
  });
}

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) redirect("/sign-in");
  if (!user.industry) redirect("/onboarding");

  let insight = user.industryInsight;

  if (!insight || isIndustryInsightStale(insight)) {
    insight = await getIndustryInsights();
  }

  if (!insight) {
    return { user, insight: null };
  }

  return { user, insight };
}

export default async function DashboardPage() {
  const { user, insight } = await getDashboardData();

  if (!insight) return <EmptyState userName={user.name || user.email} />;

  const upcomingInterviews = await getUpcomingInterviews(user.id);

  return (
    <DashboardContent
      userName={user.name || "there"}
      userEmail={user.email}
      currentRole={user.currentRole}
      targetRole={user.targetRole}
      careerGoals={user.careerGoals}
      experience={user.experience}
      skills={user.skills}
      insight={insight}
      upcomingInterviews={upcomingInterviews}
    />
  );
}
