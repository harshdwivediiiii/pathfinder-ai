import { Suspense } from "react";
import { getWorkspaces } from "@/actions/workspace";
import { WorkspaceDialog } from "./_components/workspace-dialog";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
  title: "Project Workspaces | Pathfinder AI",
  description: "Manage your project workspaces and notes",
};

export default async function WorkspacesPage() {
  const workspaces = await getWorkspaces();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-primary" />
            Project Workspaces
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize your project notes, agent outputs, and context in one place.
          </p>
        </div>
        <WorkspaceDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </WorkspaceDialog>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl bg-card border-dashed">
          <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create a workspace to keep track of your project-related conversations, generated content, and important notes.
          </p>
          <WorkspaceDialog>
            <Button>Create Your First Workspace</Button>
          </WorkspaceDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/workspace/${ws.id}`}>
              <div className="group border rounded-2xl p-5 bg-card hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {ws.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {ws.description || "No description provided."}
                </p>
                <div className="flex items-center text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Updated {formatDistanceToNow(new Date(ws.updatedAt), { addSuffix: true })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
