/**
 * Workspace-specific error classes.
 * Stored outside "use server" files so they can be imported by both
 * server actions and client components.
 */
export class WorkspaceNotFoundError extends Error {
  constructor(message = "Workspace not found or unauthorized") {
    super(message);
    this.name = "WorkspaceNotFoundError";
    this.code = "WORKSPACE_NOT_FOUND";
  }
}
