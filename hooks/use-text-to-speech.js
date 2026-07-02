import { useState, useCallback, useEffect } from "react";
import { useAccessibility } from "@/components/accessibility-provider";
import { toast } from "sonner";

export function useTextToSpeech() {
  const { speechSpeed, preferredVoiceLanguage } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text) => {
    if (!supported || typeof window === "undefined") return;

    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechSpeed || 1.0;

    // Map short-code -> BCP-47 locale
    let targetLocales = [];
    if (preferredVoiceLanguage === "hi") {
      targetLocales = ["hi-IN"];
    } else {
      targetLocales = ["en-IN", "en-US"];
    }

    // Set utterance.lang (improves pronunciation and browser matching)
    utterance.lang = targetLocales[0];

    // Strengthen voice matching — three-tier fallback
    let voice = null;
    
    // Tier 1: Exact locale match
    for (const locale of targetLocales) {
      voice = voices.find((v) => v.lang === locale);
      if (voice) {
        break;
      }
    }
    
    // Tier 2: Prefix match
    if (!voice) {
      voice = voices.find((v) => v.lang.startsWith(preferredVoiceLanguage));
    }

    // Tier 3: System default
    if (!voice && voices.length > 0) {
      voice = voices.find((v) => v.default) || voices[0];
      if (preferredVoiceLanguage !== "en") {
         toast.info(`Preferred voice language (${preferredVoiceLanguage}) not available. Using default.`);
      }
    }

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [speechSpeed, preferredVoiceLanguage, supported, voices]);

  const cancel = useCallback(() => {
    if (!supported || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  return { speak, cancel, isSpeaking, supported };
}
