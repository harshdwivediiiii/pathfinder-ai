import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspacesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          </h1>
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-2xl p-5 bg-card h-48 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-3" />
            <div className="h-4 w-full bg-muted rounded animate-pulse mb-1" />
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse mb-4 flex-1" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse mt-auto pt-4 border-t border-border/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
