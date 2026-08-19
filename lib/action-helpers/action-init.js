import { getAuthenticatedHistoryUser } from "@/lib/history/history-auth";
import { USER_NOT_FOUND_RESPONSE } from "@/lib/errors/user-not-found";

export async function initializeAuthenticatedAction() {
  const user = await getAuthenticatedHistoryUser();

  if (!user) {
    return USER_NOT_FOUND_RESPONSE;
  }

  return { user };
}