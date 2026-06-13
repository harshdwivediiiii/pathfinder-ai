"use client";

import { useState, useEffect } from "react";
import { getJobApplications } from "@/actions/job-tracker";
import KanbanBoard from "./_components/KanbanBoard";
import { Sparkles, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export default function JobTrackerPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const result = await getJobApplications();
        if (result.success) {
          setJobs(result.data);
        }
      } catch (error) {
        console.error("Failed to load jobs", error);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col h-screen">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <Briefcase className="h-3 w-3" />
              Job Tracker
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Your <span className="text-gradient-primary">Applications</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Manage and track your job hunt pipeline in one place.
            </p>
          </div>
        </motion.div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <KanbanBoard initialJobs={jobs} setJobs={setJobs} />
          )}
        </div>
      </div>
    </div>
  );
}
