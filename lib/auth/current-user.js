import { getUserByClerkId } from "@/lib/auth/user";

export async function getCurrentUser(userId) {
  return getUserByClerkId(userId);
}