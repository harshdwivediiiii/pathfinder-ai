import { expect, it } from "vitest";

import { normalizeAtsSuggestion, normalizeAtsSuggestions } from "../lib/ats.js";

it("normalizeAtsSuggestion preserves structured suggestion objects", () => {
  const result = normalizeAtsSuggestion({ category: "Keywords", tip: "Add missing terms" });

  expect(result).toEqual({ category: "Keywords", tip: "Add missing terms" });
});

it("normalizeAtsSuggestion converts legacy strings into displayable suggestions", () => {
  const result = normalizeAtsSuggestion("Use more action verbs");

  expect(result).toEqual({ category: "Suggestion", tip: "Use more action verbs" });
});

it("normalizeAtsSuggestions filters empty entries and normalizes mixed input", () => {
  const result = normalizeAtsSuggestions([
    { category: "Formatting", tip: "Tighten layout" },
    "Add measurable outcomes",
    null,
    { tip: "" },
  ]);

  expect(result).toEqual([
    { category: "Formatting", tip: "Tighten layout" },
    { category: "Suggestion", tip: "Add measurable outcomes" },
  ]);
});