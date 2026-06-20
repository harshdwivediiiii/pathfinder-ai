import { buildSecurePrompt } from "@/lib/prompt-safety";

export function createAiPrompt(config) {
  return buildSecurePrompt(config);
}