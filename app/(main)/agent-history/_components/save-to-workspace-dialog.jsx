"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FolderKanban, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWorkspaces, saveAgentOutput } from "@/actions/workspace";

export function SaveToWorkspaceDialog({ run, children }) {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [title, setTitle] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    let active = true;
    if (open) {
      setTitle(`${run?.agentName || "Agent"} Output - ${new Date().toLocaleDateString()}`);
      
      const loadWorkspaces = async () => {
        setLoading(true);
        try {
          const wses = await getWorkspaces();
          if (!active) return;
          setWorkspaces(wses);
          if (wses.length > 0 && !selectedWorkspace) {
            setSelectedWorkspace(wses[0].id);
          }
        } catch (error) {
          if (!active) return;
          toast.error("Failed to load workspaces");
        } finally {
          if (active) setLoading(false);
        }
      };
      
      loadWorkspaces();
    }
    return () => { active = false; };
  }, [open]); // Note: intentionally omitted 'run' to avoid identity-change resets

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!selectedWorkspace || !trimmedTitle) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSaving(true);
    try {
      await saveAgentOutput(selectedWorkspace, trimmedTitle, run.output, run.id);
      toast.success("Saved to workspace successfully!");
      setOpen(false);
      router.push(`/workspace/${selectedWorkspace}`);
    } catch (error) {
      toast.error("Failed to save to workspace");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            Save to Workspace
          </DialogTitle>
          <DialogDescription>
            Save this agent's output to a project workspace for future reference.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="workspace">Select Workspace</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading workspaces...
              </div>
            ) : workspaces.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2 border rounded bg-muted/50">
                No workspaces found. Create one first from the Workspaces page.
              </div>
            ) : (
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger id="workspace">
                  <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title for Output</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Initial Draft, Review Feedback"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedWorkspace || workspaces.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save to Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
