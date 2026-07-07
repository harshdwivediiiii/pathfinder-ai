import React from "react";
import { getAuthenticatedUser } from "@/lib/authenticated-user";
import prisma from "@/lib/prisma";
import { getInterviewInsights } from "@/lib/interview-insights";
import { ProgressionChart, CategoryRadarChart } from "@/components/interview-dashboard-charts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Mock Interview Dashboard",
  description: "Track your interview performance and get AI-powered insights.",
};

export default async function InterviewDashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  const sessions = await prisma.mockInterviewSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!sessions || sessions.length === 0) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center space-y-6 text-center h-full min-h-[50vh]">
        <div className="bg-primary/10 p-6 rounded-full">
          <Brain className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">No Interview Data Yet</h1>
        <p className="text-muted-foreground max-w-md">
          Start your first mock interview to get detailed analytics, performance tracking, and AI-driven insights to help you land your dream job.
        </p>
        <Link href="/interview/mock">
          <Button size="lg" className="mt-4">Start Mock Interview</Button>
        </Link>
      </div>
    );
  }

  // Pre-calculate insights directly if not too many
  const insights = await getInterviewInsights(user.id);

  const averageScore = Math.round(
    sessions.reduce((acc, s) => acc + s.overallScore, 0) / sessions.length
  );

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Performance Dashboard</h1>
        <p className="text-muted-foreground">Track your mock interview progress and focus areas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(sessions[0].overallScore)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Score Progression</CardTitle>
            <CardDescription>Your overall scores over recent sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressionChart data={sessions} />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Skill Breakdown</CardTitle>
            <CardDescription>Average performance across key metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryRadarChart data={sessions} />
          </CardContent>
        </Card>
      </div>

      {insights && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription>{insights.summary}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" /> 
                Key Weaknesses
              </h4>
              <ul className="space-y-2">
                {insights.weaknesses?.map((w, i) => (
                  <li key={i} className="text-sm bg-background p-2 rounded-md border">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Recommended Practice Topics
              </h4>
              <ul className="space-y-2">
                {insights.practiceTopics?.map((t, i) => (
                  <li key={i} className="text-sm bg-background p-2 rounded-md border">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
