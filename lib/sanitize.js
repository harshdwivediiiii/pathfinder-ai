export function sanitizeInput(text) {
  if (!text) return "";

  const injectionPattern = /ignore\s+(?:all\s+)?previous\s+instructions?|forget\s+previous\s+instructions?|disregard\s+(?:all\s+)?previous\s+instructions?|system\s+override|prompt\s+injection|reveal\s+(?:the\s+)?system\s+prompt|show\s+me\s+(?:the\s+)?hidden\s+prompt/gi;

  return text
    .replace(injectionPattern, "[REDACTED_SYSTEM_OVERRIDE_ATTEMPT]")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Neutralize dangerous HTML tags
    .trim();
}
