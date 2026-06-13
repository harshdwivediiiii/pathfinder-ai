"use client";

import { useEffect, useState } from "react";
import { getJobAnalytics } from "@/actions/job-tracker";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { Briefcase, Target, Building2, TrendingUp, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#71717a'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getJobAnalytics();
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">No Data Yet</h2>
        <p className="text-muted-foreground max-w-md">
          Start adding job applications to your tracker to see your analytics and insights here.
        </p>
        <Link href="/job-tracker" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold">
          Go to Job Tracker
        </Link>
      </div>
    );
  }

  const statusData = Object.entries(data.statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/job-tracker" aria-label="Back to job tracker" className="p-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Application Analytics</h1>
          <p className="text-muted-foreground font-medium">Insights into your job hunt pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col gap-2">
          <div className="p-2 bg-blue-500/10 w-fit rounded-xl text-blue-500">
            <Briefcase className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Apps</p>
          <h3 className="text-4xl font-black">{data.total}</h3>
        </div>
        
        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col gap-2">
          <div className="p-2 bg-green-500/10 w-fit rounded-xl text-green-500">
            <Target className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Interviews</p>
          <h3 className="text-4xl font-black">
            {data.statusCounts["Interview"] || 0}
          </h3>
        </div>

        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col gap-2">
          <div className="p-2 bg-amber-500/10 w-fit rounded-xl text-amber-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Offers</p>
          <h3 className="text-4xl font-black">
            {data.statusCounts["Offer"] || 0}
          </h3>
        </div>

        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col gap-2">
          <div className="p-2 bg-purple-500/10 w-fit rounded-xl text-purple-500">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Companies</p>
          <h3 className="text-4xl font-black">{data.uniqueCompanyCount ?? data.companyData.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold mb-6">Pipeline Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold mb-6">Response Rate by Role</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.roleData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="responseRate" name="Response Rate (%)" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
