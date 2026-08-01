export async function getHistoryRecords(model, userId) {
  if (!model) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`getHistoryRecords: no Prisma model provided for user ${userId}`);
    }
    return [];
  }
  return model.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
export async function getUserHistory(model, userId, orderBy) {
  if (!model) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`getUserHistory: no Prisma model provided for user ${userId}`);
    }
    return [];
  }
  return model.findMany({
    where: { userId },
    orderBy,
  });
}