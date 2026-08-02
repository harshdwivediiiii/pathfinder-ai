"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { issueSchema } from "@/lib/schemas/issue";
import { handleServerError } from "@/lib/error-handler";

export async function createIssue(data) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized to submit an issue." };
    }

    const validatedData = issueSchema.parse(data);

    const dbUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    const issue = await db.issue.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority,
        url: validatedData.url || null,
        userId: dbUser ? dbUser.id : null,
      },
    });

    return { success: true, issueId: issue.id };
  } catch (error) {
    if (error.name === 'ZodError') {
      return { success: false, error: "Validation failed. Please check your inputs." };
    }
    console.error("Error creating issue:", error);
    // Use the global error handler if it exists, or just return false
    return { success: false, error: "An unexpected error occurred while saving your issue." };
  }
}
