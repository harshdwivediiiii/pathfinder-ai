export function buildUserFilter(userId) {
  return {
    where: {
      userId,
    },
  };
}