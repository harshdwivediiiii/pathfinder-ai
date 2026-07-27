"use server";
import { db } from "@/lib/db/prisma";

export async function logActivity(userId, action) {
  try {
    await db.activityLog.create({ data: { userId, action } });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}