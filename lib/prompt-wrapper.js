import { buildSecurePrompt } from "@/lib/prompt-safety";

export function createPrompt(config) {
  return buildSecurePrompt(config);
}