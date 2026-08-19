import { useAccessibility } from "@/components/accessibility-provider";
import { translations } from "@/lib/misc/translations";

export function useTranslation() {
  const { preferredLanguage } = useAccessibility();
  
  // 1. Fallback to "en" if the active language is unknown
  const activeLanguage = translations[preferredLanguage] ? preferredLanguage : "en";
  const dict = translations[activeLanguage];
  const fallbackDict = translations["en"];

  const t = (key) => {
    // 2. Fallback to "en" for missing keys, then to the key itself
    if (dict[key] !== undefined) {
      return dict[key];
    }
    if (fallbackDict[key] !== undefined) {
      return fallbackDict[key];
    }
    return key;
  };

  return { t, language: activeLanguage };
}
