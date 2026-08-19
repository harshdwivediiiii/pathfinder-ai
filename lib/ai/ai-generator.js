import { generateGeminiContent } from "@/lib/ai/gemini";

export async function invokeAiGeneration(prompt) {
  return generateGeminiContent(prompt);
}