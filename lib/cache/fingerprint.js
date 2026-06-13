import "server-only";
import crypto from "crypto";

export function normalizePrompt(prompt = "") {
  return prompt
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

export function createPromptFingerprint(prompt = "") {
  const normalized = normalizePrompt(prompt);

  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex");
}