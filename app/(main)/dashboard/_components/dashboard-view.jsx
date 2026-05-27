"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, MapPin, Briefcase } from "lucide-react";

export default function DashboardView({ insights, atsAnalyses = [] }) {
  // Format ATS trend data
  const chartData = atsAnalyses
    .slice()
    .reverse()
    .map((analysis) => ({
      name: format(new Date(analysis.createdAt), "MMM d"),
      score: analysis.atsScore,
      fullDate: format(new Date(analysis.createdAt), "PPP"),
    }))
    .slice(-10); // Last 10 analyses

  // Prepare skills distribution data
  const skillData = insights?.topSkills?.map((skill, index) => ({
    name: skill,
    value: 100 - index * 10, // Mocked value for visualization if not provided
  })) || [];

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ATS Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>ATS Score Trend</CardTitle>
            <CardDescription>Compatibility scores over time</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-sm text-xs">
                            <p className="font-medium">{payload[0].payload.fullDate}</p>
                            <p className="text-primary">Score: {payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No ATS scans yet. Start by analyzing a job description!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Ranges */}
        <Card>
          <CardHeader>
            <CardTitle>Market Salary Ranges</CardTitle>
            <CardDescription>Current benchmarks for your industry</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {insights?.salaryRanges?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.salaryRanges}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="role" hide />
                  <YAxis hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-sm text-xs">
                            <p className="font-medium">{data.role}</p>
                            <p className="text-muted-foreground">Median: ${data.median.toLocaleString()}</p>
                            <p className="text-muted-foreground">Range: ${data.min.toLocaleString()} - ${data.max.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="median" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Salary data unavailable for this industry.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Industry Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase tracking-wider">Demand Level</CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              {insights?.demandLevel || "N/A"}
              {insights?.demandLevel === "High" ? (
                <TrendingUp className="text-green-500 w-5 h-5" />
              ) : (
                <TrendingDown className="text-yellow-500 w-5 h-5" />
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase tracking-wider">Growth Rate</CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              {insights?.growthRate ? `${insights.growthRate}%` : "N/A"}
              <TrendingUp className="text-green-500 w-5 h-5" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase tracking-wider">Top Location</CardDescription>
            <CardTitle className="text-xl flex items-center justify-between">
              {insights?.salaryRanges?.[0]?.location || "Remote"}
              <MapPin className="text-blue-500 w-5 h-5" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Top In-Demand Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights?.topSkills?.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Career Insights */}
        <Card>
          <CardHeader>
            <CardTitle>AI Market Outlook</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insights?.marketOutlook || "Keep improving your skills to stay competitive in the market."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
