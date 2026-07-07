import { generateGeminiContent } from "@/lib/gemini";

export async function invokeAiGeneration(prompt) {
  return generateGeminiContent(prompt);
}