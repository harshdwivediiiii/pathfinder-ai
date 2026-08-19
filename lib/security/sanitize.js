export function sanitizeInput(text) {
  if (!text) return "";

  return text
    // Strip null bytes that cause string truncation
    .replace(/\x00/g, "")
    // Replace other control characters (except safe whitespace: tab, newline, cr)
    .replace(/[\x01-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .replace(/(ignore\s+previous\s+instruction|system\s+override|prompt\s+injection)/gi, "[REDACTED_SYSTEM_OVERRIDE_ATTEMPT]")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, (m) => (m === "<" ? "&lt;" : "&gt;"))
    .trim();
}

export function sanitizeQueryParam(value, maxLength = 255) {
  if (typeof value !== "string") return "";
  return sanitizeInput(value).slice(0, maxLength);
}
