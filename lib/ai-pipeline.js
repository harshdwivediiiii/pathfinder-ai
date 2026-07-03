import { generateGeminiContent } from "@/lib/gemini";

export async function runAiGeneration(prompt) {
  return generateGeminiContent(prompt);
}