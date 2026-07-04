export const EMPTY_HISTORY_RESPONSE = {
  success: true,
  data: [],
};

export function createHistoryResponse(records) {
  return {
    success: true,
    data: records,
  };
}