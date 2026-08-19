export async function getAuthenticatedUserId(auth) {
  const { userId } = await auth();
  return userId;
}