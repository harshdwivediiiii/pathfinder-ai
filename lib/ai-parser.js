import { parseAIJson } from "@/lib/prompt-safety";
import { getAiResponseText } from "@/lib/ai-response";

export function parseAiResponse(aiResult) {
  return parseAIJson(getAiResponseText(aiResult));
}