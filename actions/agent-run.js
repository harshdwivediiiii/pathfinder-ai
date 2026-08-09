"use server";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { AgentRunStatus } from "@prisma/client";
import { z } from "zod";

const AGENT_RUN_PAGE_SIZE_MAX = 100;

const agentRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(AGENT_RUN_PAGE_SIZE_MAX).default(50),
  cursor: z.string().cuid().optional(),
});

const createAgentRunSchema = z.object({
  agentName: z.string().trim().min(1).max(120),
  userPrompt: z.string().trim().min(1).max(10000),
  status: z.nativeEnum(AgentRunStatus).default(AgentRunStatus.Running),
});

export async function getAgentRuns({ limit = 50, cursor } = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const validation = agentRunsQuerySchema.safeParse({ limit, cursor: cursor || undefined });
    if (!validation.success) throw new Error("Invalid pagination parameters");

    const query = {
      where: {
        user: {
          clerkUserId: userId,
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: validation.data.limit,
    };

    if (validation.data.cursor) {
      query.cursor = { id: validation.data.cursor };
      query.skip = 1;
    }

    const runs = await db.agentRun.findMany(query);

    return { runs };
  } catch (error) {
    console.error("Error fetching agent runs:", error);
    const message = ["Unauthorized", "Invalid pagination parameters"].includes(error.message) ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function getAgentRun(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const run = await db.agentRun.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!run) throw new Error("Agent run not found");

    return { run };
  } catch (error) {
    console.error("Error fetching agent run:", error);
    const message = ["Unauthorized", "User not found", "Agent run not found"].includes(error.message) ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function createAgentRun(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const validation = createAgentRunSchema.safeParse(data);
    if (!validation.success) throw new Error("Invalid agent run payload");

    const run = await db.agentRun.create({
      data: {
        userId: user.id,
        agentName: validation.data.agentName,
        userPrompt: validation.data.userPrompt,
        status: validation.data.status,
        startedAt: new Date(),
      },
    });

    revalidatePath("/agent-history");

    return { run };
  } catch (error) {
    console.error("Error creating agent run:", error);
    const message = ["Unauthorized", "User not found", "Invalid agent run payload"].includes(error.message) ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function updateAgentRun(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const updateData = {
      status: data.status,
      output: data.output,
      errorMessage: data.errorMessage,
    };
    if (data.status !== undefined) {
      updateData.completedAt = data.status !== AgentRunStatus.Running ? new Date() : null;
    }

    const result = await db.agentRun.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: updateData,
    });

    if (result.count === 0) throw new Error("Agent run not found");

    const run = await db.agentRun.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
    if (!run) throw new Error("Agent run not found");

    revalidatePath("/agent-history");
    revalidatePath(`/agent-history/${id}`);

    return { run };
  } catch (error) {
    console.error("Error updating agent run:", error);
    let message = "An unexpected error occurred.";
    if (error.code === "P2025") {
      message = "Agent run not found";
    } else if (["Unauthorized", "User not found", "Agent run not found"].includes(error.message)) {
      message = error.message;
    }
    return { error: message };
  }
}
