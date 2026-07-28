"use server";
import { db } from "@/lib/db/prisma";

export async function logActivity(userId, action) {
  if (!userId) {
    console.warn("Skipping activity logging because userId is missing.");
    return;
  }
  try {
    await db.activityLog.create({ data: { userId, action } });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}