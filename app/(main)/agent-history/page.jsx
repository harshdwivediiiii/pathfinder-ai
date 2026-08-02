"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { getAgentRuns } from "@/actions/agent-run";
import { AgentRunStatus } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Eye, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function AgentHistoryPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchRuns() {
      try {
        const res = await getAgentRuns();
        if (!mounted) return;
        if (res.error) throw new Error(res.error);
        setRuns(res.runs || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRuns();
    return () => {
      mounted = false;
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case AgentRunStatus.Completed:
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case AgentRunStatus.Running:
        return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Running</Badge>;
      case AgentRunStatus.Failed:
        return <Badge variant="destructive">Failed</Badge>;
      case AgentRunStatus.Cancelled:
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <History className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading agent history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">Failed to load history: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Terminal className="h-8 w-8 text-primary" />
            Agent Run History
          </h1>
          <p className="text-muted-foreground">
            Review and replay your past AI agent tasks and workflows.
          </p>
        </div>
      </div>

      {runs.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Agent Runs Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't run any AI agents yet. When you use tools like the ATS Analyzer or Interview Coach, their history will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {runs.map((run, index) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {run.agentName}
                        {getStatusBadge(run.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Started {format(new Date(run.startedAt), "PPp")}
                      </CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/agent-history/${run.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-md p-4">
                    <p className="text-sm font-medium mb-2 text-muted-foreground">Prompt/Input:</p>
                    <p className="text-sm line-clamp-2">
                      {run.userPrompt}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
