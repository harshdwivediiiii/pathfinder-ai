import { getUserByClerkId } from "@/lib/auth/user";

export async function getHistoryUser(userId) {
  return getUserByClerkId(userId);
}