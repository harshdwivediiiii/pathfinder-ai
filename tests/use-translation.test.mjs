import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/components/accessibility-provider", () => ({
  useAccessibility: vi.fn(),
}));

vi.mock("@/lib/misc/translations", () => ({
  translations: {
    en: {
      greeting: "Hello",
      farewell: "Goodbye",
      missing: "This key exists in English only",
    },
    hi: {
      greeting: "Namaste",
      farewell: "Alvida",
    },
  },
}));

import { useTranslation } from "../hooks/use-translation.js";
import { useAccessibility } from "@/components/accessibility-provider";

describe("useTranslation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns English translation when preferredLanguage is en", () => {
    useAccessibility.mockReturnValue({ preferredLanguage: "en" });

    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe("en");
    expect(result.current.t("greeting")).toBe("Hello");
    expect(result.current.t("farewell")).toBe("Goodbye");
  });

  it("returns Hindi translation when preferredLanguage is hi", () => {
    useAccessibility.mockReturnValue({ preferredLanguage: "hi" });

    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe("hi");
    expect(result.current.t("greeting")).toBe("Namaste");
    expect(result.current.t("farewell")).toBe("Alvida");
  });

  it("falls back to English when language is unknown", () => {
    useAccessibility.mockReturnValue({ preferredLanguage: "fr" });

    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe("en");
    expect(result.current.t("greeting")).toBe("Hello");
  });

  it("falls back to English dict when key is missing in active language", () => {
    useAccessibility.mockReturnValue({ preferredLanguage: "hi" });

    const { result } = renderHook(() => useTranslation());

    // "missing" key does not exist in Hindi, should fall back to English
    expect(result.current.t("missing")).toBe("This key exists in English only");
  });

  it("returns the key itself when key is not found in any language", () => {
    useAccessibility.mockReturnValue({ preferredLanguage: "en" });

    const { result } = renderHook(() => useTranslation());

    expect(result.current.t("nonexistentKey")).toBe("nonexistentKey");
  });

  it("returns the key itself when no language is configured", () => {
    useAccessibility.mockReturnValue({ preferredLanguage: null });

    const { result } = renderHook(() => useTranslation());

    expect(result.current.language).toBe("en");
    expect(result.current.t("greeting")).toBe("Hello");
  });
});
