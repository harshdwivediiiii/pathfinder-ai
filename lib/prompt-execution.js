import { buildSecurePrompt } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function executeSecurePrompt(config) {
  const prompt = buildSecurePrompt(config);
  return generateGeminiContent(prompt);
}