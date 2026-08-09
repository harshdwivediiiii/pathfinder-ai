"use server";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const workspaceInputSchema = z.object({
  title: z.string().trim().min(1, "Workspace title is required").max(160, "Workspace title is too long"),
  description: z.string().trim().max(2000, "Workspace description is too long").optional().or(z.literal("")),
});

const noteContentSchema = z.string().trim().min(1, "Note content is required").max(20000, "Note content is too long");
const pinTypeSchema = z.enum(["note", "agentOutput"]);

const agentOutputSchema = z.object({
  title: z.string().trim().min(1, "Agent output title is required").max(200, "Agent output title is too long"),
  content: z.unknown().refine((value) => {
    try {
      return JSON.stringify(value).length <= 100000;
    } catch {
      return false;
    }
  }, "Agent output content is too large or invalid"),
  agentRunId: z.string().cuid().nullable().optional(),
});

function parseWorkspaceInput(data) {
  return workspaceInputSchema.parse({
    title: data?.title,
    description: data?.description || "",
  });
}

/**
 * Centralized authorization helpers
 */
async function getOwnedWorkspace(id, clerkUserId, include = {}) {
  const workspace = await db.projectWorkspace.findFirst({
    where: {
      id,
      user: { clerkUserId },
    },
    include,
  });
  if (!workspace) {
    const err = new Error("Workspace not found or unauthorized");
    err.code = "WORKSPACE_NOT_FOUND";
    throw err;
  }
  return workspace;
}

async function getOwnedNote(id, clerkUserId, include = {}) {
  const note = await db.projectNote.findFirst({
    where: {
      id,
      workspace: { user: { clerkUserId } },
    },
    include,
  });
  if (!note) {
    const err = new Error("Note not found or unauthorized");
    err.code = "WORKSPACE_NOT_FOUND";
    throw err;
  }
  return note;
}

async function getOwnedAgentOutput(id, clerkUserId, include = {}) {
  const output = await db.projectAgentOutput.findFirst({
    where: {
      id,
      workspace: { user: { clerkUserId } },
    },
    include,
  });
  if (!output) {
    const err = new Error("Agent output not found or unauthorized");
    err.code = "WORKSPACE_NOT_FOUND";
    throw err;
  }
  return output;
}


export async function getWorkspaces() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const workspaces = await db.projectWorkspace.findMany({
      where: {
        user: { clerkUserId: userId },
      },
      orderBy: { updatedAt: "desc" },
    });

    return workspaces;
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    throw error;
  }
}

export async function getWorkspace(id) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const workspace = await getOwnedWorkspace(id, userId, {
      notes: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      agentOutputs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    });

    return workspace;
  } catch (error) {
    console.error("Error fetching workspace:", error);
    throw error;
  }
}

export async function createWorkspace(data) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const validatedData = parseWorkspaceInput(data);
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const workspace = await db.projectWorkspace.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        activities: {
          create: {
            type: "CREATED",
            description: "Workspace created",
          },
        },
      },
    });

    revalidatePath("/workspace");
    return workspace;
  } catch (error) {
    console.error("Error creating workspace:", error);
    throw error;
  }
}

export async function updateWorkspace(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const validatedData = parseWorkspaceInput(data);
    const existing = await getOwnedWorkspace(id, userId);

    const workspace = await db.projectWorkspace.update({
      where: { id: existing.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        activities: {
          create: {
            type: "UPDATED",
            description: "Workspace details updated",
          },
        },
      },
    });

    revalidatePath(`/workspace/${id}`);
    revalidatePath("/workspace");
    return workspace;
  } catch (error) {
    console.error("Error updating workspace:", error);
    throw error;
  }
}

export async function deleteWorkspace(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const existing = await getOwnedWorkspace(id, userId);

    await db.projectWorkspace.delete({
      where: { id: existing.id },
    });

    revalidatePath("/workspace");
    return { success: true };
  } catch (error) {
    console.error("Error deleting workspace:", error);
    throw error;
  }
}

export async function createNote(workspaceId, content) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    
    const validatedContent = noteContentSchema.parse(content);
    const workspace = await getOwnedWorkspace(workspaceId, userId);

    const note = await db.projectNote.create({
      data: {
        workspaceId: workspace.id,
        content: validatedContent,
      },
    });

    await db.projectActivity.create({
      data: {
        workspaceId: workspace.id,
        type: "NOTE_ADDED",
        description: "Added a new note",
      },
    });

    revalidatePath(`/workspace/${workspaceId}`);
    return note;
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
}

export async function updateNote(noteId, content) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const validatedContent = noteContentSchema.parse(content);
    const note = await getOwnedNote(noteId, userId);

    const updatedNote = await db.projectNote.update({
      where: { id: note.id },
      data: { content: validatedContent },
    });

    await db.projectActivity.create({
      data: {
        workspaceId: note.workspaceId,
        type: "NOTE_UPDATED",
        description: "Updated a note",
      },
    });

    revalidatePath(`/workspace/${note.workspaceId}`);
    return updatedNote;
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
}

export async function deleteNote(noteId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const note = await getOwnedNote(noteId, userId);

    await db.projectNote.delete({
      where: { id: note.id },
    });

    await db.projectActivity.create({
      data: {
        workspaceId: note.workspaceId,
        type: "NOTE_DELETED",
        description: "Deleted a note",
      },
    });

    revalidatePath(`/workspace/${note.workspaceId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
}

export async function togglePin(type, id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    
    const validatedType = pinTypeSchema.parse(type);
    let workspaceId;
    if (validatedType === "note") {
      const note = await getOwnedNote(id, userId);
      workspaceId = note.workspaceId;
      
      // Atomic raw update for nitpick requirement
      await db.$executeRaw`UPDATE "ProjectNote" SET "isPinned" = NOT "isPinned" WHERE "id" = ${note.id}`;
      
    } else if (validatedType === "agentOutput") {
      const output = await getOwnedAgentOutput(id, userId);
      workspaceId = output.workspaceId;
      
      // Atomic raw update for nitpick requirement
      await db.$executeRaw`UPDATE "ProjectAgentOutput" SET "isPinned" = NOT "isPinned" WHERE "id" = ${output.id}`;
      
    } else {
      throw new Error("Invalid type");
    }

    await db.projectActivity.create({
      data: {
        workspaceId,
        type: "PIN_TOGGLED",
        description: `Toggled pin for ${validatedType === "note" ? "a note" : "an agent output"}`,
      },
    });

    revalidatePath(`/workspace/${workspaceId}`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling pin:", error);
    throw error;
  }
}

export async function saveAgentOutput(workspaceId, title, content, agentRunId = null) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    
    const validatedOutput = agentOutputSchema.parse({
      title,
      content,
      agentRunId,
    });
    const workspace = await getOwnedWorkspace(workspaceId, userId);
    const validatedAgentRunId = validatedOutput.agentRunId || null;

    if (validatedAgentRunId) {
      const ownedRun = await db.agentRun.findFirst({
        where: {
          id: validatedAgentRunId,
          user: { clerkUserId: userId },
        },
        select: { id: true },
      });

      if (!ownedRun) {
        throw new Error("Agent run not found or unauthorized");
      }
    }

    const output = await db.projectAgentOutput.create({
      data: {
        workspaceId: workspace.id,
        title: validatedOutput.title,
        content: validatedOutput.content,
        agentRunId: validatedAgentRunId,
      },
    });

    await db.projectActivity.create({
      data: {
        workspaceId: workspace.id,
        type: "AGENT_OUTPUT_SAVED",
        description: `Saved agent output: ${validatedOutput.title}`,
      },
    });

    revalidatePath(`/workspace/${workspaceId}`);
    return output;
  } catch (error) {
    console.error("Error saving agent output:", error);
    throw error;
  }
}
