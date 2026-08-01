const DEFAULT_MAX_LENGTH = 8_000;
const EMPTY_FALLBACK = "[not provided]";

export function sanitizePromptInput(value, maxLength = DEFAULT_MAX_LENGTH) {
  if (value === null || value === undefined) return EMPTY_FALLBACK;

  let str = String(value);

  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  str = str.replace(/[ \t]+/g, " ");
  str = str.trim();

  if (str.length > maxLength) {
    str = str.slice(0, maxLength);
    const lastSpace = str.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.8) {
      str = str.slice(0, lastSpace);
    }
  }

  return str || EMPTY_FALLBACK;
}
