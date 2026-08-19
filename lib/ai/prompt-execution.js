import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";

export async function executeSecurePrompt(config) {
  const prompt = buildSecurePrompt(config);
  return generateGeminiContent(prompt);
}