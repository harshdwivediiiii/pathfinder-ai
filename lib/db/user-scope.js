import { db } from "@/lib/db/prisma";

export async function getUserByScope(userId) {
  return db.user.findUnique({
    where: { clerkUserId: userId },
  });
}