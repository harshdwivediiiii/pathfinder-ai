"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  History,
  RotateCcw,
  Trash2,
  Clock,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ResumeVersionHistory({
  history = [],
  onRestore,
  onDelete,
  restoringVersionId = null,
  deletingVersionId = null,
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(null);

  const versions = Array.isArray(history) ? history : [];

  const handleDelete = async (versionId) => {
    if (!onDelete) return;

    await onDelete(versionId);
    setDeleteDialogOpen(null);
  };

  if (versions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <History className="h-7 w-7 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold">
            No resume versions yet
          </h3>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Previous versions of your resume will appear here automatically
            whenever you make changes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5" />

        <div>
          <h2 className="text-lg font-semibold">
            Resume Version History
          </h2>

          <p className="text-sm text-muted-foreground">
            {versions.length}{" "}
            {versions.length === 1 ? "version" : "versions"} saved
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {versions.map((version) => {
          const versionId = version.id;

          const createdAt = version.createdAt
            ? new Date(version.createdAt)
            : null;

          const isRestoring = restoringVersionId === versionId;
          const isDeleting = deletingVersionId === versionId;

          return (
            <Card
              key={versionId}
              className="transition-shadow hover:shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div>
                      <CardTitle className="text-base">
                        Version {version.version}
                      </CardTitle>

                      {createdAt && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />

                          <span>
                            {formatDistanceToNow(createdAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    {createdAt && (
                      <span>
                        Saved on{" "}
                        {createdAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isRestoring || isDeleting}
                      onClick={() => onRestore?.(version)}
                      aria-label={`Restore resume version ${version.version}`}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />

                      {isRestoring ? "Restoring..." : "Restore"}
                    </Button>

                    <AlertDialog
                      open={deleteDialogOpen === versionId}
                      onOpenChange={(open) =>
                        setDeleteDialogOpen(open ? versionId : null)
                      }
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isRestoring || isDeleting}
                          aria-label={`Delete resume version ${version.version}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this resume version?
                          </AlertDialogTitle>

                          <AlertDialogDescription>
                            This will permanently delete Version{" "}
                            {version.version}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancel
                          </AlertDialogCancel>

                          <AlertDialogAction
                            onClick={() => handleDelete(versionId)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete Version"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}