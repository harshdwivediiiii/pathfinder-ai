import { db } from "@/lib/db/prisma";

export async function getUserByClerkId(userId) {
  if (!userId) return null;

  return db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });
}