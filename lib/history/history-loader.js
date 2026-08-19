export function buildHistoryResponse(records) {
  return {
    success: true,
    data: records,
  };
}
export async function loadHistory(historyLoader) {
  return historyLoader();
}