import { auth } from "@clerk/nextjs/server";

export async function getAuthenticatedUserId() {
  const { userId } = await auth();
  return userId;
}