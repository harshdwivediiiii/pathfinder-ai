import { db } from "@/lib/db/prisma";

export async function getAuthenticatedUser(userId) {
  return db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });
}

export function validateAuthenticatedUser(user) {
  return !!user;
}