import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/auth/user";

export async function getAuthenticatedUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return getUserByClerkId(userId);
}