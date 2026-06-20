"use client";

import { deleteResumeMatchAnalysis } from "@/actions/resume-match";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Trash2, Building, Target, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MatchHistory({ history, setHistory, onSelect }) {
  
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this analysis?")) return;

    try {
      const result = await deleteResumeMatchAnalysis(id);
      if (result.success) {
        setHistory(prev => prev.filter(item => item.id !== id));
        toast.success("Analysis deleted.");
      } else {
        toast.error(result.errors?._form?.[0] || "Failed to delete.");
      }
    } catch (error) {
      toast.error("An error occurred during deletion.");
    }
  };

  if (history.length === 0) {
    return (
      <Card className="glass border-border/50 bg-background/50 text-center py-16">
        <CardContent className="flex flex-col items-center justify-center text-muted-foreground space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
            <Target className="w-8 h-8 opacity-50" />
          </div>
          <p className="font-semibold text-lg text-foreground">No analyses found</p>
          <p className="text-sm">Run your first resume match to see your history here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {history.map((item) => {
        const scoreColor = item.matchScore >= 75 ? "text-green-500" : item.matchScore >= 50 ? "text-amber-500" : "text-red-500";
        const scoreBg = item.matchScore >= 75 ? "bg-green-500/10" : item.matchScore >= 50 ? "bg-amber-500/10" : "bg-red-500/10";

        return (
          <Card 
            key={item.id} 
            className="glass border-border/50 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-md"
            onClick={() => onSelect(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item);
              }
            }}
            tabIndex={0}
          >
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-4 flex-1 w-full overflow-hidden">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${scoreBg}`}>
                  <span className={`font-black text-lg ${scoreColor}`}>{Math.round(item.matchScore)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground text-base truncate pr-4">
                    {item.jobTitle || "Target Position"}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Building className="w-3 h-3" />
                    <span className="truncate">{item.companyName || "Target Company"}</span>
                    <span>&bull;</span>
                    <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  onClick={(e) => handleDelete(item.id, e)}
                  title="Delete analysis"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
