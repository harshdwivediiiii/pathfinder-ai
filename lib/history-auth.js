import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/user";

export async function getHistoryUserContext() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return getUserByClerkId(userId);
}

export async function getAuthenticatedHistoryUser() {
  const { userId } = await auth();

  if (!userId) return null;

  return getUserByClerkId(userId);
}
export const getAuthenticatedHistoryUser = getHistoryUserContext;
