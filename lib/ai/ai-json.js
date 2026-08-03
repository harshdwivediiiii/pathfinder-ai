import { parseAIJson } from "@/lib/ai/prompt-safety";

export function parseAiResponse(aiResult) {
  const text = typeof aiResult === "string" ? aiResult : aiResult?.response?.text?.();
  return parseAIJson(text);
}