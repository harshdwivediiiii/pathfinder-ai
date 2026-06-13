const DEFAULT_SUGGESTION_CATEGORY = "Suggestion";

export function normalizeAtsSuggestion(suggestion) {
  if (typeof suggestion === "string") {
    const tip = suggestion.trim();
    return tip ? { category: DEFAULT_SUGGESTION_CATEGORY, tip } : null;
  }

  if (!suggestion || typeof suggestion !== "object") {
    return null;
  }

  const category = String(
    suggestion.category ?? suggestion.title ?? suggestion.label ?? DEFAULT_SUGGESTION_CATEGORY
  ).trim() || DEFAULT_SUGGESTION_CATEGORY;

  const tip = String(
    suggestion.tip ?? suggestion.description ?? suggestion.suggestion ?? suggestion.text ?? ""
  ).trim();

  return tip ? { ...suggestion, category, tip } : null;
}

export function normalizeAtsSuggestions(suggestions) {
  if (!Array.isArray(suggestions)) {
    return [];
  }

  return suggestions.map(normalizeAtsSuggestion).filter(Boolean);
}