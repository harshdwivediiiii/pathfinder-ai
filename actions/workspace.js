"use server";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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

    const workspace = await db.projectWorkspace.findUnique({
      where: {
        id,
      },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
        },
        agentOutputs: {
          orderBy: { createdAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    // We can't directly filter by user on findUnique if user relation is to internal User id.
    // Let's verify ownership:
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!workspace || workspace.userId !== user?.id) {
      throw new Error("Workspace not found or unauthorized");
    }

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

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const workspace = await db.projectWorkspace.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
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
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify ownership
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    const existing = await db.projectWorkspace.findUnique({ where: { id } });
    if (!existing || existing.userId !== user?.id) {
      throw new Error("Unauthorized");
    }

    const workspace = await db.projectWorkspace.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
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
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    const existing = await db.projectWorkspace.findUnique({ where: { id } });
    if (!existing || existing.userId !== user?.id) {
      throw new Error("Unauthorized");
    }

    await db.projectWorkspace.delete({
      where: { id },
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
    if (!userId) {
      throw new Error("Unauthorized");
    }
    
    // Verify ownership
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    const workspace = await db.projectWorkspace.findUnique({ where: { id: workspaceId } });
    if (!workspace || workspace.userId !== user?.id) {
      throw new Error("Unauthorized");
    }

    const note = await db.projectNote.create({
      data: {
        workspaceId,
        content,
      },
    });

    await db.projectActivity.create({
      data: {
        workspaceId,
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
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify ownership
    const note = await db.projectNote.findUnique({
      where: { id: noteId },
      include: { workspace: true },
    });
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    
    if (!note || note.workspace.userId !== user?.id) {
      throw new Error("Unauthorized");
    }

    const updatedNote = await db.projectNote.update({
      where: { id: noteId },
      data: { content },
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
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const note = await db.projectNote.findUnique({
      where: { id: noteId },
      include: { workspace: true },
    });
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    
    if (!note || note.workspace.userId !== user?.id) {
      throw new Error("Unauthorized");
    }

    await db.projectNote.delete({
      where: { id: noteId },
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
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    
    let workspaceId;
    if (type === "note") {
      const note = await db.projectNote.findUnique({ where: { id }, include: { workspace: true } });
      if (!note || note.workspace.userId !== user?.id) throw new Error("Unauthorized");
      
      await db.projectNote.update({
        where: { id },
        data: { isPinned: !note.isPinned },
      });
      workspaceId = note.workspaceId;
    } else if (type === "agentOutput") {
      const output = await db.projectAgentOutput.findUnique({ where: { id }, include: { workspace: true } });
      if (!output || output.workspace.userId !== user?.id) throw new Error("Unauthorized");
      
      await db.projectAgentOutput.update({
        where: { id },
        data: { isPinned: !output.isPinned },
      });
      workspaceId = output.workspaceId;
    } else {
      throw new Error("Invalid type");
    }

    await db.projectActivity.create({
      data: {
        workspaceId,
        type: "PIN_TOGGLED",
        description: `Toggled pin for ${type === "note" ? "a note" : "an agent output"}`,
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
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    const workspace = await db.projectWorkspace.findUnique({ where: { id: workspaceId } });
    
    if (!workspace || workspace.userId !== user?.id) {
      throw new Error("Unauthorized");
    }

    const output = await db.projectAgentOutput.create({
      data: {
        workspaceId,
        title,
        content,
        agentRunId,
      },
    });

    await db.projectActivity.create({
      data: {
        workspaceId,
        type: "AGENT_OUTPUT_SAVED",
        description: `Saved agent output: ${title}`,
      },
    });

    revalidatePath(`/workspace/${workspaceId}`);
    return output;
  } catch (error) {
    console.error("Error saving agent output:", error);
    throw error;
  }
}
