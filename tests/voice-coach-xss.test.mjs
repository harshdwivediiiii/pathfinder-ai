import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import VoiceCoachPage from "../app/(main)/interview/voice-coach/page.jsx";

const mockTranslations = {
  en: {
    voiceCoach: "Voice Coach",
    speakWithConfidencePrefix: "Speak with ",
    speakWithConfidenceHighlight: "Confidence",
    interviewQuestion: "Tell me about a time when you had to overcome a significant technical challenge at work.",
    practiceSkills: "Practice your verbal communication skills. We'll transcribe your answer and score it on confidence and filler words.",
    speechRecognitionNotSupported: "Speech Recognition Not Supported",
    useCompatibleBrowser: "Please use a compatible browser like Google Chrome or Microsoft Edge.",
    prompt: "Prompt",
    recordingClickToStop: "Recording... Click to stop.",
    clickMicToStart: "Click the mic to start your answer",
    analyzingResponse: "Analyzing your response...",
    performanceAnalysis: "Performance Analysis",
    score: "Score",
    fillerWordsDetected: "Filler Words Detected",
    fillerWordsExamples: '("um", "uh", "like")',
    confidenceLevel: "Confidence Level",
    aiFeedback: "AI Feedback",
    tryAgain: "Try Again",
    noSpeechDetected: "No speech detected. Please try again.",
    browserNoSpeechSupport: "Your browser does not support Speech Recognition. Try Chrome.",
  },
  hi: {
    voiceCoach: "वॉयस कोच",
    speakWithConfidenceHighlight: "आत्मविश्वास",
    speakWithConfidenceSuffix: " के साथ बोलें",
    interviewQuestion: "मुझे उस समय के बारे में बताएं जब आपको काम पर एक महत्वपूर्ण तकनीकी चुनौती को पार करना पड़ा था।",
    practiceSkills: "अपने मौखिक संचार कौशल का अभ्यास करें। हम आपके उत्तर को लिखेंगे और आत्मविश्वास और भराव शब्दों पर इसका मूल्यांकन करेंगे।",
    speechRecognitionNotSupported: "वाक् पहचान समर्थित नहीं है",
    useCompatibleBrowser: "कृपया Google Chrome या Microsoft Edge जैसे संगत ब्राउज़र का उपयोग करें।",
    prompt: "प्रॉम्प्ट",
    recordingClickToStop: "रिकॉर्डिंग हो रही है... रोकने के लिए क्लिक करें।",
    clickMicToStart: "अपना उत्तर शुरू करने के लिए माइक पर क्लिक करें",
    analyzingResponse: "आपके उत्तर का विश्लेषण किया जा रहा है...",
    performanceAnalysis: "प्रदर्शन विश्लेषण",
    score: "स्कोर",
    fillerWordsDetected: "भराव शब्द पाए गए",
    fillerWordsExamples: '("उम", "उह", "जैसे")',
    confidenceLevel: "आत्मविश्वास का स्तर",
    aiFeedback: "एआई प्रतिक्रिया",
    tryAgain: "फिर से प्रयास करें",
    noSpeechDetected: "कोई आवाज़ नहीं पाई गई। कृपया फिर से प्रयास करें।",
    browserNoSpeechSupport: "आपका ब्राउज़र वाक् पहचान का समर्थन नहीं करता है। क्रोम आज़माएं।",
  }
};

const accessibilityMock = {
  useAccessibility: () => ({
    preferredLanguage: "en"
  })
};

const textToSpeechMock = {
  useTextToSpeech: () => ({
    speak: vi.fn(),
    cancel: vi.fn(),
    supported: true
  })
};

const fetchMock = {
  useFetch: () => ({
    data: null,
    loading: false,
    error: null,
    fn: vi.fn()
  })
};

vi.mock("@/components/accessibility-provider", () => accessibilityMock);
vi.mock("@/hooks/use-text-to-speech", () => textToSpeechMock);
vi.mock("@/hooks/use-fetch", () => fetchMock);
vi.mock("@/hooks/use-translation", () => ({
  useTranslation: () => ({
    t: (key) => mockTranslations.en[key] || key,
    language: "en"
  })
}));

describe("Voice Coach XSS Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Translation Security", () => {
    it("renders plain text translation correctly without HTML escaping issues", () => {
      const { container } = render(<VoiceCoachPage />);
      const heading = screen.queryByText(/Speak with/i);
      expect(heading).toBeTruthy();
    });

    it("does not contain dangerouslySetInnerHTML in rendered output", () => {
      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain("dangerouslySetInnerHTML");
    });

    it("renders gradient text using React JSX instead of HTML", () => {
      const { container } = render(<VoiceCoachPage />);
      const gradientElements = container.querySelectorAll('.text-gradient-primary');
      expect(gradientElements.length).toBeGreaterThan(0);
    });
  });

  describe("XSS Payload Prevention", () => {
    it("prevents script tag injection", () => {
      const maliciousTranslation = {
        ...mockTranslations.en,
        speakWithConfidenceHighlight: '<script>alert("XSS")</script>Confidence'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousTranslation[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('<script>');
    });

    it("prevents img onerror injection", () => {
      const maliciousTranslation = {
        ...mockTranslations.en,
        speakWithConfidenceHighlight: '<img src=x onerror=alert("XSS")>Confidence'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousTranslation[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('onerror=');
    });

    it("prevents javascript: URL injection", () => {
      const maliciousTranslation = {
        ...mockTranslations.en,
        speakWithConfidenceHighlight: '<a href="javascript:alert(1)">Confidence</a>'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousTranslation[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('javascript:');
    });

    it("prevents SVG onload injection", () => {
      const maliciousTranslation = {
        ...mockTranslations.en,
        speakWithConfidenceHighlight: '<svg onload=alert(1)>Confidence</svg>'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousTranslation[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('onload=');
    });

    it("prevents iframe injection", () => {
      const maliciousTranslation = {
        ...mockTranslations.en,
        speakWithConfidenceHighlight: '<iframe src="javascript:alert(1)">Confidence</iframe>'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousTranslation[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('<iframe');
    });

    it("prevents object tag injection", () => {
      const maliciousTranslation = {
        ...mockTranslations.en,
        speakWithConfidenceHighlight: '<object data="javascript:alert(1)">Confidence</object>'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousTranslation[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('<object');
    });

    it("prevents embed tag injection", () => {
      const maliciousTranslation = {
        ...mockTranslations.en,
        speakWithConfidenceHighlight: '<embed src="javascript:alert(1)">Confidence</embed>'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousTranslation[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('<embed');
    });

    it("prevents style tag injection", () => {
      const maliciousTranslation = {
        ...mockTranslations.en,
        speakWithConfidenceHighlight: '<style>body{background:red}</style>Confidence'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousTranslation[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('<style>');
    });
  });

  describe("Hindi Translation Security", () => {
    it("renders Hindi translation correctly without HTML", () => {
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => mockTranslations.hi[key] || key,
          language: "hi"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const gradientElements = container.querySelectorAll('.text-gradient-primary');
      expect(gradientElements.length).toBeGreaterThan(0);
    });

    it("prevents XSS in Hindi translations", () => {
      const maliciousHindiTranslation = {
        ...mockTranslations.hi,
        speakWithConfidenceHighlight: '<script>alert("XSS")</script>आत्मविश्वास'
      };
      
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => maliciousHindiTranslation[key] || key,
          language: "hi"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toContain('<script>');
    });
  });

  describe("Backward Compatibility", () => {
    it("renders existing English translations correctly", () => {
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => mockTranslations.en[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      expect(container.textContent).toContain("Speak with");
      expect(container.textContent).toContain("Confidence");
    });

    it("renders existing Hindi translations correctly", () => {
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => mockTranslations.hi[key] || key,
          language: "hi"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      expect(container.textContent).toContain("आत्मविश्वास");
      expect(container.textContent).toContain("बोलें");
    });

    it("maintains gradient styling for highlighted text", () => {
      vi.mock("@/hooks/use-translation", () => ({
        useTranslation: () => ({
          t: (key) => mockTranslations.en[key] || key,
          language: "en"
        })
      }));

      const { container } = render(<VoiceCoachPage />);
      const gradientElements = container.querySelectorAll('.text-gradient-primary');
      expect(gradientElements.length).toBeGreaterThan(0);
      expect(gradientElements[0].textContent).toBe("Confidence");
    });
  });

  describe("No dangerouslySetInnerHTML Usage", () => {
    it("component does not use dangerouslySetInnerHTML prop", () => {
      const { container } = render(<VoiceCoachPage />);
      const htmlString = container.innerHTML;
      expect(htmlString).not.toMatch(/dangerouslySetInnerHTML/i);
    });
  });
});
