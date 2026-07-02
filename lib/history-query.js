export async function getHistoryRecords(model, userId) {
  return model.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
export async function getUserHistory(model, userId, orderBy) {
  return model.findMany({
    where: { userId },
    orderBy,
  });
}