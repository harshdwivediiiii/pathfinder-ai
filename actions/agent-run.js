"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { AgentRunStatus } from "@prisma/client";

export async function getAgentRuns({ limit = 50, cursor } = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return { runs: [] };
    }

    const runs = await db.agentRun.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        startedAt: "desc",
      },
      take: limit,
    });

    return { runs };
  } catch (error) {
    console.error("Error fetching agent runs:", error);
    
    return {
      error: error.message,
    };
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

    const run = await db.agentRun.create({
      data: {
        userId: user.id,
        agentName: data.agentName,
        userPrompt: data.userPrompt,
        status: data.status || AgentRunStatus.Running,
        startedAt: new Date(),
      },
    });

    revalidatePath("/agent-history");

    return { run };
  } catch (error) {
    console.error("Error creating agent run:", error);
    const message = ["Unauthorized", "User not found"].includes(error.message) ? error.message : "An unexpected error occurred.";
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

    const run = await db.agentRun.update({
      where: {
        id,
        userId: user.id,
      },
      data: updateData,
    });

    revalidatePath("/agent-history");
    revalidatePath(`/agent-history/${id}`);

    return { run };
  } catch (error) {
    console.error("Error updating agent run:", error);
    const message = ["Unauthorized", "User not found", "Agent run not found"].includes(error.message) ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}