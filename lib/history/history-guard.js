import { getAuthenticatedHistoryUser } from "@/lib/history/history-auth";

export async function requireHistoryUser() {
  const user = await getAuthenticatedHistoryUser();

  if (!user) {
    return {
      success: false,
      data: [],
    };
  }

  return user;
}