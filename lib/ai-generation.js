import { generateGeminiContent } from "@/lib/gemini";
import { parseAIJson } from "@/lib/prompt-safety";

export async function generateAndParseJson(prompt) {
  const aiResult = await generateGeminiContent(prompt);
  return parseAIJson(aiResult.response.text());
}