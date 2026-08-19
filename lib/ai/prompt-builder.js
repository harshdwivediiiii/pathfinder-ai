import { buildSecurePrompt } from "@/lib/ai/prompt-safety";

export function createAiPrompt(config) {
  return buildSecurePrompt(config);
}