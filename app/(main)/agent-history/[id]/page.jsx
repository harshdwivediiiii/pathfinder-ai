"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getAgentRun, createAgentRun } from "@/actions/agent-run";
import { AgentRunStatus } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, AlertCircle, Clock, CheckCircle2, RotateCcw, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SaveToWorkspaceDialog } from "../_components/save-to-workspace-dialog";

export default function AgentRunDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRun() {
      try {
        const res = await getAgentRun(id);
        if (res.error) throw new Error(res.error);
        setRun(res.run);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchRun();
  }, [id]);

  const handleReplay = async () => {
    try {
      toast.info("Agent Replay Initiated", {
        description: "Creating a new run...",
      });
      const res = await createAgentRun({
        agentName: run.agentName,
        userPrompt: run.userPrompt,
        status: AgentRunStatus.Running
      });
      if (res.error) throw new Error(res.error);
      
      toast.success("New run started successfully!");
      // Since we don't have a specific tool mapped yet in this generic handler,
      // we navigate to the new run's history page to see its progress.
      router.push(`/agent-history/${res.run.id}`);
    } catch (err) {
      toast.error("Failed to replay agent", {
        description: err.message
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RotateCcw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading run details...</p>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/agent-history">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Link>
        </Button>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">Failed to load agent run: {error || "Not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case AgentRunStatus.Completed: return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case AgentRunStatus.Running: return <RotateCcw className="h-5 w-5 text-blue-500 animate-spin" />;
      case AgentRunStatus.Failed: return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/agent-history">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30 border-b pb-6">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  {run.agentName}
                  <div className="flex items-center gap-1 text-sm font-normal bg-background px-3 py-1 rounded-full border shadow-sm">
                    {getStatusIcon(run.status)}
                    <span className="capitalize">{run.status}</span>
                  </div>
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Run ID: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{run.id}</code>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {run.status === AgentRunStatus.Completed && (
                  <SaveToWorkspaceDialog run={run}>
                    <Button variant="outline" size="lg" className="gap-2">
                      <FolderKanban className="h-4 w-4" />
                      Save to Workspace
                    </Button>
                  </SaveToWorkspaceDialog>
                )}
                <Button onClick={handleReplay} size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  Run Again
                </Button>
              </div>
            </div>
            <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Started: {format(new Date(run.startedAt), "PPpp")}
              </div>
              {run.completedAt && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed: {format(new Date(run.completedAt), "PPpp")}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8 pt-6">
            {/* Input Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">User Input / Prompt</h3>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm border font-mono">
                {run.userPrompt}
              </div>
            </div>

            {/* Output Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">Agent Output</h3>
              {run.status === AgentRunStatus.Failed ? (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Error Details
                  </p>
                  <p className="text-sm font-mono">{run.errorMessage || "An unknown error occurred."}</p>
                </div>
              ) : run.status === AgentRunStatus.Running ? (
                <div className="bg-muted/50 p-8 rounded-lg border text-center flex flex-col items-center">
                  <RotateCcw className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground">Agent is currently processing this task...</p>
                </div>
              ) : (
                <div className="bg-background p-4 rounded-lg border text-sm prose dark:prose-invert max-w-none">
                  {run.output ? (
                    typeof run.output === 'string' ? (
                      <div className="whitespace-pre-wrap">{run.output}</div>
                    ) : (
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                        {JSON.stringify(run.output, null, 2)}
                      </pre>
                    )
                  ) : (
                    <p className="text-muted-foreground italic">No output was generated for this run.</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
