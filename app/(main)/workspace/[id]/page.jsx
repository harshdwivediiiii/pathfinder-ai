import { Suspense, cache } from "react";
import { getWorkspace, WorkspaceNotFoundError } from "@/actions/workspace";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { 
  FolderKanban, 
  Settings, 
  ArrowLeft,
  Calendar,
  Clock
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceDialog } from "../_components/workspace-dialog";
import { NoteList } from "../_components/note-list";
import { ActivityTimeline } from "../_components/activity-timeline";

const getCachedWorkspace = cache(getWorkspace);

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const workspace = await getCachedWorkspace(id);
    return {
      title: `${workspace.title} | Project Workspace`,
    };
  } catch (e) {
    if (e instanceof WorkspaceNotFoundError || e.code === "WORKSPACE_NOT_FOUND") {
      return { title: "Workspace Not Found" };
    }
    throw e;
  }
}

export default async function WorkspacePage({ params }) {
  const { id } = await params;
  let workspace;
  
  try {
    workspace = await getCachedWorkspace(id);
  } catch (error) {
    if (error instanceof WorkspaceNotFoundError || error.code === "WORKSPACE_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <Link 
          href="/workspace" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="mr-1 w-4 h-4" />
          Back to Workspaces
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <FolderKanban className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{workspace.title}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created {format(new Date(workspace.createdAt), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Updated {format(new Date(workspace.updatedAt), "MMM d")}
                </span>
              </div>
            </div>
          </div>
          <WorkspaceDialog workspace={workspace}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </WorkspaceDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Content Tabs */}
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
              <TabsTrigger 
                value="notes"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
              >
                Notes & Context
              </TabsTrigger>
              <TabsTrigger 
                value="outputs"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
              >
                Agent Outputs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-0 outline-none">
              <div className="bg-card border rounded-2xl p-6 shadow-sm">
                {workspace.description && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Project Goal
                    </h3>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {workspace.description}
                    </p>
                  </div>
                )}
                <NoteList workspaceId={workspace.id} notes={workspace.notes} />
              </div>
            </TabsContent>

            <TabsContent value="outputs" className="mt-0 outline-none">
              <div className="bg-card border rounded-2xl p-6 shadow-sm min-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Saved Agent Outputs</h3>
                </div>
                {workspace.agentOutputs.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-xl bg-muted/20">
                    <p className="text-muted-foreground">No outputs saved yet.</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      When using agents across the platform, you can save their outputs directly to this workspace.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {workspace.agentOutputs.map(output => (
                      <div key={output.id} className="p-4 border rounded-xl hover:border-primary/50 transition-colors">
                        <h4 className="font-semibold mb-2">{output.title}</h4>
                        <pre className="text-sm bg-muted/50 p-3 rounded-lg overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                          {typeof output.content === "string"
                            ? output.content
                            : JSON.stringify(output.content, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Activity History
            </h3>
            <ActivityTimeline activities={workspace.activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
