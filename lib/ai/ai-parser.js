import { parseAIJson } from "@/lib/ai/prompt-safety";
import { getAiResponseText } from "@/lib/ai/ai-response";

export function parseAiResponse(aiResult) {
  return parseAIJson(getAiResponseText(aiResult));
}