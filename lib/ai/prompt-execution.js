import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";

export async function executeSecurePrompt(config) {
  if (!config) throw new Error('Config is required');
  const prompt = buildSecurePrompt(config);
  return generateGeminiContent(prompt);
}