export function buildUserLookup(userId) {
  return {
    where: {
      clerkUserId: userId,
    },
  };
}