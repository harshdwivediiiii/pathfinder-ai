export function getAiResponseText(aiResult) {
  if (!aiResult?.response) return "";
  return aiResult.response.text() ?? "";
}
