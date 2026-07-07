import { getAuthenticatedHistoryUser } from "@/lib/history-auth";
import { USER_NOT_FOUND_RESPONSE } from "@/lib/user-not-found";

export async function initializeAuthenticatedAction() {
  const user = await getAuthenticatedHistoryUser();

  if (!user) {
    return USER_NOT_FOUND_RESPONSE;
  }

  return { user };
}