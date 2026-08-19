import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/prisma";

export async function getAuthenticatedUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return db.user.findUnique({
    where: { clerkUserId: userId },
  });
}