import { auth } from "@clerk/nextjs/server";

export async function getActionContext() {
  const { userId } = await auth();

  return {
    userId,
  };
}
export const ACTION_CONTEXT = {
  ASSIGNMENT: "assignment",
  BURNOUT: "burnout",
};