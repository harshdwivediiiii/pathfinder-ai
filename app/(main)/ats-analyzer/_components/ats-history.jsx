"use client";

import { useState, useTransition } from "react";
import { deleteATSAnalysis } from "@/actions/ats";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  Briefcase,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { normalizeAtsSuggestions } from "@/lib/ats";

function ScoreBadge({ score }) {
  if (score >= 75)
    return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30">{Math.round(score)} — Strong</Badge>;
  if (score >= 50)
    return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">{Math.round(score)} — Fair</Badge>;
  return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">{Math.round(score)} — Needs Work</Badge>;
}

function HistoryCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const suggestions = normalizeAtsSuggestions(item.suggestions);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteATSAnalysis(item.id);
        if (result && result.success) {
          toast.success("Analysis deleted.");
          onDelete(item.id);
        } else {
          const msg = result?.errors?._form?.[0] || result?.errors?.message || "Failed to delete.";
          toast.error(msg);
        }
      } catch (err) {
        toast.error(err.message || "Failed to delete.");
      }
    });
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <ScoreBadge score={item.atsScore} />
                {(item.jobTitle || item.companyName) && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    {item.jobTitle}
                    {item.jobTitle && item.companyName ? " @ " : ""}
                    {item.companyName}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(item.createdAt), "MMM d, yyyy · h:mm a")}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <>Hide <ChevronUp className="h-3.5 w-3.5 ml-1" /></>
                ) : (
                  <>Details <ChevronDown className="h-3.5 w-3.5 ml-1" /></>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0 space-y-4 border-t">
            {item.overallFeedback && (
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Overall Feedback</p>
                <p className="text-sm leading-relaxed">{item.overallFeedback}</p>
              </div>
            )}

            {/* keyword summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Matched ({item.matchedKeywords?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {(item.matchedKeywords || []).slice(0, 8).map((kw) => (
                    <span key={kw} className="text-xs bg-green-500/20 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                  {(item.matchedKeywords || []).length > 8 && (
                    <span className="text-xs text-muted-foreground">+{item.matchedKeywords.length - 8} more</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 mb-2">
                  <XCircle className="h-3.5 w-3.5" />
                  Missing ({item.missingKeywords?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {(item.missingKeywords || []).slice(0, 8).map((kw) => (
                    <span key={kw} className="text-xs bg-red-500/20 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                  {(item.missingKeywords || []).length > 8 && (
                    <span className="text-xs text-muted-foreground">+{item.missingKeywords.length - 8} more</span>
                  )}
                </div>
              </div>
            </div>

            {/* top suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top Suggestions</p>
                {suggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex gap-2 text-sm p-2 rounded-md bg-muted/40">
                    <span className="text-violet-500 font-semibold flex-shrink-0">{s.category}:</span>
                    <span className="text-muted-foreground">{s.tip}</span>
                  </div>
                ))}
                {suggestions.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-1">+{suggestions.length - 3} more suggestions</p>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the ATS analysis record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ATSHistory({ history, onDelete }) {
  const safeHistory = Array.isArray(history) ? history : [];

  if (safeHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calendar className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No analyses yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Run your first ATS analysis to see your history here. Track your improvement over time!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {safeHistory.length} {safeHistory.length === 1 ? "analysis" : "analyses"} · Sorted newest first
      </p>
      {safeHistory.map((item) => (
        <HistoryCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
}
