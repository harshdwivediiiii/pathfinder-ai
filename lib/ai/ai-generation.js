import { generateGeminiContent } from "@/lib/ai/gemini";
import { parseAIJson } from "@/lib/ai/prompt-safety";

export async function generateAndParseJson(prompt) {
  const aiResult = await generateGeminiContent(prompt);
  return parseAIJson(aiResult.response.text());
}