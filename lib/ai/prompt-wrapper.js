import { buildSecurePrompt } from "@/lib/ai/prompt-safety";

export function createPrompt(config) {
  return buildSecurePrompt(config);
}