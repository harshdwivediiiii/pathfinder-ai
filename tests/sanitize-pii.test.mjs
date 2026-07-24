import { describe, it, expect } from "vitest";
import { sanitizePII, sanitizePIIPayload, hasPII } from "../lib/utils/sanitizePII.js";

describe("PII Sanitizer Utility", () => {
  describe("sanitizePII", () => {
    it("should mask email addresses with [REDACTED EMAIL]", () => {
      const input = "Please reach out to john.doe@example.com or jane_doe123@domain.co.in.";
      const output = sanitizePII(input);
      expect(output).toBe("Please reach out to [REDACTED EMAIL] or [REDACTED EMAIL].");
    });

    it("should mask phone numbers in various formats with [REDACTED PHONE]", () => {
      const input1 = "Call me at +91 98765-43210 immediately.";
      const input2 = "Reach us at (123) 456-7890 or 123-456-7890.";
      const input3 = "Direct line: 9876543210.";

      expect(sanitizePII(input1)).toBe("Call me at [REDACTED PHONE] immediately.");
      expect(sanitizePII(input2)).toBe("Reach us at [REDACTED PHONE] or [REDACTED PHONE].");
      expect(sanitizePII(input3)).toBe("Direct line: [REDACTED PHONE].");
    });

    it("should mask US Social Security Numbers with [REDACTED SSN]", () => {
      const input = "SSN: 123-45-6789 confidential.";
      expect(sanitizePII(input)).toBe("SSN: [REDACTED SSN] confidential.");
    });

    it("should preserve non-PII technical text, years, and metrics", () => {
      const input = "In 2026, improved performance by 100% using React 19 and Node 22. Zip code 90210.";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should handle empty or non-string inputs safely", () => {
      expect(sanitizePII("")).toBe("");
      expect(sanitizePII(null)).toBe(null);
      expect(sanitizePII(undefined)).toBe(undefined);
    });

    it("should redact multiple PII types in a single string", () => {
      const input =
        "Contact john@example.com or call +91 9876543210. SSN: 123-45-6789.";

      expect(sanitizePII(input)).toBe(
        "Contact [REDACTED EMAIL] or call +91 [REDACTED PHONE]. SSN: [REDACTED SSN]."
      );
    });
  });

  describe("sanitizePIIPayload", () => {
    it("should recursively sanitize string fields in an object payload", () => {
      const payload = {
        companyName: "Acme Corp",
        jobTitle: "Software Engineer",
        jobDescription: "Apply at candidate@example.com or call 9876543210 for details.",
        metadata: {
          contact: "reach test@domain.com",
        },
      };

      const sanitized = sanitizePIIPayload(payload);

      expect(sanitized.companyName).toBe("Acme Corp");
      expect(sanitized.jobTitle).toBe("Software Engineer");
      expect(sanitized.jobDescription).toBe("Apply at [REDACTED EMAIL] or call [REDACTED PHONE] for details.");
      expect(sanitized.metadata.contact).toBe("reach [REDACTED EMAIL]");
    });

    it("should sanitize arrays recursively", () => {
      const payload = [
        "Email john@example.com",
        {
          phone: "9876543210",
        },
      ];

      const sanitized = sanitizePIIPayload(payload);

      expect(sanitized[0]).toBe("Email [REDACTED EMAIL]");
      expect(sanitized[1].phone).toBe("[REDACTED PHONE]");
    });

    it("should sanitize deeply nested payloads", () => {
      const payload = {
        level1: {
          level2: {
            level3: {
              contact: "john@example.com",
            },
          },
        },
      };

      const sanitized = sanitizePIIPayload(payload);

      expect(sanitized.level1.level2.level3.contact).toBe(
        "[REDACTED EMAIL]"
      );
    });
  });

  describe("hasPII", () => {
    it("should return true if email or phone is present", () => {
      expect(hasPII("My email is test@domain.com")).toBe(true);
      expect(hasPII("Call +91 98765-43210")).toBe(true);
      expect(hasPII("SSN 123-45-6789")).toBe(true);
    });

    it("should return false if no PII is present", () => {
      expect(hasPII("Experienced Full Stack Developer with 5 years experience.")).toBe(false);
      expect(hasPII("")).toBe(false);
    });

    it("should return false for invalid inputs", () => {
      expect(hasPII(null)).toBe(false);
      expect(hasPII(undefined)).toBe(false);
      expect(hasPII(12345)).toBe(false);
      expect(hasPII({})).toBe(false);
      expect(hasPII([])).toBe(false);
    });
  });
});
